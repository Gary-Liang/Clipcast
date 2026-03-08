# Remotion Lambda Setup Guide

This guide walks you through deploying your Remotion video renderer to AWS Lambda for scalable, cloud-based video generation.

## Prerequisites

1. **AWS Account** - You'll need an AWS account with appropriate permissions
2. **AWS CLI** - Install from https://aws.amazon.com/cli/
3. **AWS Credentials** - Configure with `aws configure`

## Cost Estimate

For 100 videos/month (60 seconds each):
- Lambda compute: ~$5-10
- S3 storage: ~$2-3
- **Total: ~$10-15/month**

For 1,000 videos/month: ~$50-100

---

## Step 1: Install Remotion Lambda CLI

The Remotion Lambda package is already installed. Verify it:

```bash
npm list @remotion/lambda
```

---

## Step 2: Configure AWS Credentials

Set up your AWS credentials:

```bash
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

---

## Step 3: Deploy Remotion Lambda Function

Deploy the Lambda function and supporting infrastructure:

```bash
npx remotion lambda sites create src/remotion/Root.tsx --site-name=podcast-clips
```

This will:
1. Create an S3 bucket for your Remotion code
2. Upload your video composition
3. Create a Lambda function
4. Set up IAM roles and permissions
5. Return a `serveUrl` (save this!)

**Expected output:**
```
✓ Created site: https://remotionlambda-useast1-xxxxx.s3.amazonaws.com/sites/podcast-clips
✓ Site ID: abc123def456
```

**Save the Site ID!** You'll need it for rendering.

---

## Step 4: Deploy Lambda Functions

Deploy the rendering Lambda functions:

```bash
npx remotion lambda functions deploy --region us-east-1
```

This creates:
- Rendering function (executes Chromium)
- Orchestrator function (manages rendering jobs)

**Expected output:**
```
✓ Deployed function: remotion-render-4-0-422
✓ Function ARN: arn:aws:lambda:us-east-1:xxxxx:function:remotion-render-4-0-422
```

---

## Step 5: Test Rendering

Test your setup with a sample render:

```bash
npx remotion lambda render \
  <your-site-id> \
  PodcastClip \
  test-output.mp4 \
  --props='{"clipTitle":"Test Clip","audioUrl":"https://example.com/audio.mp3","transcript":[],"startTime":0,"endTime":60}'
```

If successful, you'll see:
```
✓ Render completed in 45s
✓ Output: s3://remotionlambda-xxxxx/renders/test-output.mp4
```

---

## Step 6: Update Environment Variables

Add these to your `.env.local`:

```bash
# Remotion Lambda Configuration
REMOTION_APP_REGION=us-east-1
REMOTION_APP_FUNCTION_NAME=remotion-render-4-0-422
REMOTION_APP_SERVE_URL=https://remotionlambda-useast1-xxxxx.s3.amazonaws.com/sites/podcast-clips

# AWS credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

---

## Step 7: Update Video Generation Service

Update `src/lib/services/video-generation.service.ts` to use Lambda:

```typescript
import { renderMediaOnLambda } from "@remotion/lambda/client";

async generateVideo(params: VideoGenerationParams): Promise<string> {
  const { clipId, clipTitle, audioUrl, transcript, startTime, endTime } = params;

  try {
    logger.info({ clipId }, "Starting Lambda video generation");

    const { renderId, bucketName } = await renderMediaOnLambda({
      region: process.env.REMOTION_APP_REGION as any,
      functionName: process.env.REMOTION_APP_FUNCTION_NAME!,
      serveUrl: process.env.REMOTION_APP_SERVE_URL!,
      composition: "PodcastClip",
      inputProps: {
        clipTitle,
        audioUrl,
        transcript,
        startTime,
        endTime,
      },
      codec: "h264",
      privacy: "public",
    });

    logger.info({ clipId, renderId }, "Render started on Lambda");

    // Poll for completion
    const { outputFile } = await getRenderProgress({
      renderId,
      bucketName,
      region: process.env.REMOTION_APP_REGION as any,
      functionName: process.env.REMOTION_APP_FUNCTION_NAME!,
    });

    logger.info({ clipId, outputFile }, "Render completed");
    return outputFile;
  } catch (error) {
    logger.error({ clipId, error }, "Lambda video generation failed");
    throw error;
  }
}
```

---

## Step 8: Monitoring & Debugging

### View Lambda Logs

```bash
npx remotion lambda functions logs \
  --function-name remotion-render-4-0-422 \
  --region us-east-1
```

### Check Render Status

```bash
npx remotion lambda renders list --region us-east-1
```

### CloudWatch Dashboard

1. Go to AWS Console → CloudWatch
2. View Lambda function metrics:
   - Invocations
   - Duration
   - Errors
   - Concurrent executions

---

## Step 9: Optimize Costs

### 1. Set Lambda Timeout

Adjust timeout based on video length:

```bash
npx remotion lambda functions deploy \
  --timeout 300 \
  --region us-east-1
```

### 2. Configure Memory

More memory = faster rendering = lower cost:

```bash
npx remotion lambda functions deploy \
  --memory 3008 \
  --region us-east-1
```

**Recommended:** 3008 MB (fastest rendering)

### 3. Use Reserved Concurrency

For predictable workloads, reserve Lambda capacity:

```bash
aws lambda put-function-concurrency \
  --function-name remotion-render-4-0-422 \
  --reserved-concurrent-executions 10
```

### 4. Enable S3 Lifecycle Policies

Auto-delete old renders after 30 days:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket remotionlambda-useast1-xxxxx \
  --lifecycle-configuration file://lifecycle.json
```

**lifecycle.json:**
```json
{
  "Rules": [{
    "Id": "DeleteOldRenders",
    "Status": "Enabled",
    "Prefix": "renders/",
    "Expiration": { "Days": 30 }
  }]
}
```

---

## Troubleshooting

### Error: "Cannot find module"

**Solution:** Redeploy the site:
```bash
npx remotion lambda sites create src/remotion/Root.tsx --site-name=podcast-clips --overwrite
```

### Error: "Task timed out after 60 seconds"

**Solution:** Increase Lambda timeout:
```bash
npx remotion lambda functions deploy --timeout 300
```

### Error: "Insufficient memory"

**Solution:** Increase Lambda memory:
```bash
npx remotion lambda functions deploy --memory 3008
```

### Render Fails Silently

**Check logs:**
```bash
npx remotion lambda renders list --region us-east-1
npx remotion lambda renders info <render-id> --region us-east-1
```

---

## Cleanup (If Needed)

To remove all Remotion Lambda resources:

```bash
# Delete functions
npx remotion lambda functions delete --region us-east-1

# Delete sites
npx remotion lambda sites delete --site-id <your-site-id> --region us-east-1

# Delete S3 buckets (careful!)
aws s3 rb s3://remotionlambda-useast1-xxxxx --force
```

---

## Security Best Practices

1. **IAM Roles:** Use IAM roles instead of hardcoding credentials
2. **S3 Bucket Policies:** Restrict access to your Lambda functions only
3. **VPC Configuration:** Run Lambda in a VPC for sensitive data
4. **Encryption:** Enable S3 bucket encryption

---

## Performance Benchmarks

Based on typical podcast clips:

| Video Length | Lambda Memory | Render Time | Cost per Render |
|--------------|---------------|-------------|-----------------|
| 30 seconds   | 2048 MB       | ~30s        | ~$0.03          |
| 60 seconds   | 2048 MB       | ~60s        | ~$0.06          |
| 30 seconds   | 3008 MB       | ~20s        | ~$0.05          |
| 60 seconds   | 3008 MB       | ~40s        | ~$0.10          |

**Recommendation:** Use 3008 MB for fastest rendering.

---

## Alternative: Local Rendering (Development)

For local testing without Lambda costs:

1. Keep the existing local rendering in `video-generation.service.ts`
2. Add an environment variable to toggle:

```typescript
const USE_LAMBDA = process.env.USE_LAMBDA === "true";

if (USE_LAMBDA) {
  // Use renderMediaOnLambda
} else {
  // Use renderMedia (local)
}
```

This allows:
- **Development:** Local rendering (free, but slow)
- **Production:** Lambda rendering (fast, scalable)

---

## Next Steps

1. Deploy to AWS Lambda following steps above
2. Test with a real podcast clip
3. Monitor costs in AWS Billing Dashboard
4. Optimize memory/timeout based on actual usage
5. Set up CloudWatch alarms for errors

---

## Support

- **Remotion Docs:** https://www.remotion.dev/docs/lambda
- **AWS Lambda Docs:** https://docs.aws.amazon.com/lambda/
- **Remotion Discord:** https://remotion.dev/discord

---

**Last Updated:** February 15, 2026
