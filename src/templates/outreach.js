/**
 * Email templates for the outreach campaigns
 */
export const outreachTemplates = {
  // Simple partnership outreach template
  partnership: (contact) => {
    const firstName = contact.firstName || 'there';
    const company = contact.companyName || 'your company';
    
    const subject = `Question regarding ${company}'s operations`;
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">
          <p>Hi ${firstName},</p>
          
          <p>I hope you're having a great week.</p>
          
          <p>I was researching companies in the tech space and came across <strong>${company}</strong>. I was really impressed by what you guys are building, especially your position in the market.</p>
          
          <p>I work with teams looking to streamline operations and cut overhead costs. I'd love to learn more about how you're currently managing this at ${company} and see if there might be a fit for collaboration.</p>
          
          <p>Do you have 5 minutes for a quick introductory call next Tuesday or Thursday?</p>
          
          <p>Best regards,<br>
          <strong>{{senderName}}</strong><br>
          {{senderEmail}}</p>
        </body>
      </html>
    `;
    
    return { subject, htmlContent };
  }
};
