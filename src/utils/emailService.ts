/**
 * Email Service for Test Completion Notifications
 */

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface TestCompletionData {
  userName: string;
  userEmail: string;
  assessmentId: string;
  domainName: string;
  totalScore: number;
  percentage: number;
  status: 'PASS' | 'FAIL';
  completedAt: string;
  confirmationNumber: string;
  round1Score: number;
  round2Score: number;
}

/**
 * Generate confirmation number
 */
export function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TC-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create email template for test completion
 */
export function createTestCompletionEmail(data: TestCompletionData): EmailTemplate {
  const subject = `Test Completion Confirmation - ${data.domainName} Assessment`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Completion Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .score-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.status === 'PASS' ? '#10b981' : '#ef4444'}; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; background: ${data.status === 'PASS' ? '#10b981' : '#ef4444'}; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .details-table th { background: #f3f4f6; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .confirmation-number { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Test Completion Confirmation</h1>
          <p>Your coding assessment has been successfully completed!</p>
        </div>
        
        <div class="content">
          <p>Dear ${data.userName},</p>
          
          <p>Congratulations on completing your <strong>${data.domainName}</strong> assessment. Here are your results:</p>
          
          <div class="score-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h2 style="margin: 0;">Overall Result</h2>
              <span class="status-badge">${data.status}</span>
            </div>
            
            <table class="details-table">
              <tr>
                <th>Round</th>
                <th>Score</th>
                <th>Max Score</th>
                <th>Percentage</th>
              </tr>
              <tr>
                <td>Round 1 (Aptitude)</td>
                <td>${data.round1Score}</td>
                <td>30</td>
                <td>${Math.round((data.round1Score / 30) * 100)}%</td>
              </tr>
              <tr>
                <td>Round 2 (Technical)</td>
                <td>${data.round2Score}</td>
                <td>70</td>
                <td>${Math.round((data.round2Score / 70) * 100)}%</td>
              </tr>
              <tr style="background: #f9fafb; font-weight: bold;">
                <td>Total</td>
                <td>${data.totalScore}</td>
                <td>100</td>
                <td>${data.percentage}%</td>
              </tr>
            </table>
          </div>
          
          <div class="confirmation-number">
            <strong>Confirmation Number: ${data.confirmationNumber}</strong><br>
            <small>Please save this number for your records</small>
          </div>
          
          <h3>Assessment Details:</h3>
          <ul>
            <li><strong>Domain:</strong> ${data.domainName}</li>
            <li><strong>Completed:</strong> ${new Date(data.completedAt).toLocaleString()}</li>
            <li><strong>Pass Threshold:</strong> 40% (Updated for coding challenges)</li>
            <li><strong>Status:</strong> ${data.status === 'PASS' ? 'Passed ✅' : 'Not Passed ❌'}</li>
          </ul>
          
          ${data.status === 'PASS' 
            ? '<p style="color: #10b981; font-weight: bold;">🎉 Congratulations! You have successfully passed the assessment.</p>'
            : '<p style="color: #ef4444; font-weight: bold;">📚 Keep practicing! You can retake the assessment to improve your score.</p>'
          }
          
          <p>Thank you for using our coding assessment platform. If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email from Techi Man Assessment Platform.<br>
          Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Test Completion Confirmation - ${data.domainName} Assessment

Dear ${data.userName},

Congratulations on completing your ${data.domainName} assessment!

RESULTS:
Overall Status: ${data.status}
Total Score: ${data.totalScore}/100 (${data.percentage}%)

Round 1 (Aptitude): ${data.round1Score}/30 (${Math.round((data.round1Score / 30) * 100)}%)
Round 2 (Technical): ${data.round2Score}/70 (${Math.round((data.round2Score / 70) * 100)}%)

CONFIRMATION NUMBER: ${data.confirmationNumber}
Please save this number for your records.

Assessment Details:
- Domain: ${data.domainName}
- Completed: ${new Date(data.completedAt).toLocaleString()}
- Pass Threshold: 40%
- Status: ${data.status === 'PASS' ? 'Passed' : 'Not Passed'}

${data.status === 'PASS' 
  ? 'Congratulations! You have successfully passed the assessment.'
  : 'Keep practicing! You can retake the assessment to improve your score.'
}

Thank you for using our coding assessment platform.

---
This is an automated email from Techi Man Assessment Platform.
Please do not reply to this email.
  `;

  return { subject, htmlContent, textContent };
}

/**
 * Send test completion email (simulation)
 */
export async function sendTestCompletionEmail(data: TestCompletionData): Promise<boolean> {
  try {
    const emailTemplate = createTestCompletionEmail(data);
    
    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    
    // For now, we'll simulate the email sending
    console.log('📧 Sending test completion email...');
    console.log('To:', data.userEmail);
    console.log('Subject:', emailTemplate.subject);
    console.log('Confirmation Number:', data.confirmationNumber);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success (in real app, handle actual email service response)
    const success = Math.random() > 0.1; // 90% success rate simulation
    
    if (success) {
      console.log('✅ Email sent successfully');
      return true;
    } else {
      console.log('❌ Email sending failed');
      return false;
    }
    
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

/**
 * Queue email for retry if sending fails
 */
export async function queueEmailForRetry(data: TestCompletionData, retryCount: number = 0): Promise<void> {
  const maxRetries = 3;
  const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
  
  if (retryCount >= maxRetries) {
    console.error('Max email retry attempts reached for:', data.confirmationNumber);
    return;
  }
  
  setTimeout(async () => {
    const success = await sendTestCompletionEmail(data);
    if (!success) {
      await queueEmailForRetry(data, retryCount + 1);
    }
  }, retryDelay);
}