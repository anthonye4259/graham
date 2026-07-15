import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%', color: 'var(--text-primary)' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ion-icon name="arrow-back-outline"></ion-icon> Back
      </button>
      
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Privacy Policy</h1>
      
      <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <p style={{ marginBottom: '16px' }}><strong>Last Updated: June 15, 2026</strong></p>
        <p style={{ marginBottom: '16px' }}>
          Graham AI ("Graham," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Graham AI mobile application and related services (collectively, the "Service"). Please read this policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
        </p>
        <p style={{ marginBottom: '16px' }}>
          If you have questions or concerns about this Privacy Policy, please contact us at <strong>support@grahamai.com</strong>.
        </p>

        {/* 1. Information We Collect */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>1. Information We Collect</h2>
        <p style={{ marginBottom: '12px' }}>We collect the following types of information when you use Graham:</p>
        
        <h3 style={{ fontSize: '17px', color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px' }}>a. Account Information</h3>
        <p style={{ marginBottom: '12px' }}>When you create an account, we collect your name and email address. If you sign in through a third-party provider (e.g., Apple Sign In, Google Sign In), we receive basic profile information from that provider.</p>
        
        <h3 style={{ fontSize: '17px', color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px' }}>b. Financial Queries</h3>
        <p style={{ marginBottom: '12px' }}>When you use Graham's AI features, we collect the stock tickers you search for and the questions you ask the AI Advisor. This includes queries submitted through the Advisor chat, stock scans, and Deep Dive reports.</p>
        
        <h3 style={{ fontSize: '17px', color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px' }}>c. Uploaded Images</h3>
        <p style={{ marginBottom: '12px' }}>You may upload images — such as screenshots, portfolio photos, or charts — to the AI Advisor for analysis. Camera and photo library access occurs only when you choose to take or select an image. These images are transmitted to our AI services for processing.</p>
        
        <h3 style={{ fontSize: '17px', color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px' }}>d. Chat History</h3>
        <p style={{ marginBottom: '12px' }}>We collect and store your conversation history with the AI Advisor to provide continuity within your chat sessions and to improve the quality of responses.</p>
        
        <h3 style={{ fontSize: '17px', color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px' }}>e. Device Information</h3>
        <p style={{ marginBottom: '12px' }}>We automatically collect certain device information, including your device model, operating system version, unique device identifiers, and general usage data. This information helps us improve app performance and diagnose technical issues.</p>

        {/* 2. Third-Party AI Services */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>2. Third-Party AI Services</h2>
        <p style={{ marginBottom: '12px' }}>
          Graham uses <strong>Google's Gemini AI service</strong> to analyze stocks, interpret financial data, and generate investment insights. This is a core part of how Graham provides value to you.
        </p>
        <p style={{ marginBottom: '12px' }}>
          <strong>When you use AI-powered features</strong> — including the Advisor chat, stock scans, and Deep Dive reports — your queries, uploaded images, and conversation history are sent to <strong>Google's Gemini API</strong> for processing. This transmission is necessary for Graham to generate AI-powered analysis and responses.
        </p>
        <p style={{ marginBottom: '12px' }}>
          On supported Apple devices, Graham may also use <strong>Apple Intelligence</strong> for on-device AI processing. Data processed by Apple Intelligence is handled locally on your device in accordance with Apple's privacy practices.
        </p>
        <p style={{ marginBottom: '12px' }}>
          Google processes data sent to the Gemini API according to <strong>Google's Privacy Policy</strong> and the <strong>Gemini API Terms of Service</strong>. We encourage you to review Google's privacy practices to understand how your data is handled by their services.
        </p>
        <p style={{ marginBottom: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Graham does not sell your personal data to third parties.
        </p>

        {/* 3. How We Use Your Information */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>3. How We Use Your Information</h2>
        <p style={{ marginBottom: '12px' }}>We use the information we collect for the following purposes:</p>
        <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
          <li style={{ marginBottom: '8px' }}>To provide AI-powered investment analysis, stock insights, and personalized financial information through the Graham AI Advisor</li>
          <li style={{ marginBottom: '8px' }}>To process and respond to your queries, including analyzing uploaded images and generating Deep Dive reports</li>
          <li style={{ marginBottom: '8px' }}>To maintain and improve the Service, including troubleshooting, data analysis, and performance optimization</li>
          <li style={{ marginBottom: '8px' }}>To process subscriptions and manage your account</li>
          <li style={{ marginBottom: '8px' }}>To communicate with you about your account, updates, and changes to our policies</li>
          <li style={{ marginBottom: '8px' }}>To comply with legal obligations and enforce our Terms of Service</li>
        </ul>

        {/* 4. Data Storage and Security */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>4. Data Storage and Security</h2>
        <p style={{ marginBottom: '12px' }}>
          User account data and app data are stored securely in <strong>Google Firebase (Firestore)</strong>, a cloud-hosted database service provided by Google. Firebase employs industry-standard security measures, including encryption in transit and at rest.
        </p>
        <p style={{ marginBottom: '16px' }}>
          AI queries — including text prompts and uploaded images — are processed in real-time by Google's Gemini API and are <strong>not stored by Graham beyond the active chat session</strong>. Once a chat session ends or is cleared, the query data is no longer retained on our servers.
        </p>

        {/* 5. Subscriptions and Payments */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>5. Subscriptions and Payments</h2>
        <p style={{ marginBottom: '12px' }}>
          Graham offers premium features through paid subscriptions. Payments are processed by <strong>Apple</strong> (via the App Store for in-app purchases) and <strong>Stripe</strong> (for web-based subscriptions). We do not directly collect or store your payment card information. All payment processing is handled securely by these third-party providers in accordance with their respective privacy policies and security standards.
        </p>

        {/* 6. Data Retention */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>6. Data Retention</h2>
        <p style={{ marginBottom: '12px' }}>
          Your account data (name, email, preferences) is retained for as long as your account is active, or until you request deletion of your account.
        </p>
        <p style={{ marginBottom: '16px' }}>
          Chat history with the AI Advisor can be cleared at any time by you within the app. When you clear your chat history, it is permanently deleted from our servers.
        </p>

        {/* 7. Your Rights */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>7. Your Rights</h2>
        <p style={{ marginBottom: '12px' }}>You have the following rights regarding your personal data:</p>
        <ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Account Deletion:</strong> You may delete your account at any time through the Settings section of the app. Deleting your account will permanently remove your personal data from our systems.</li>
          <li style={{ marginBottom: '8px' }}><strong>Data Export:</strong> You may request a copy of your personal data by contacting us at support@grahamai.com. We will provide your data in a commonly used, machine-readable format.</li>
          <li style={{ marginBottom: '8px' }}><strong>Chat History:</strong> You can clear your AI Advisor chat history at any time from within the app.</li>
          <li style={{ marginBottom: '8px' }}><strong>Correction:</strong> You may update your account information at any time through the app's Settings.</li>
        </ul>

        {/* 8. Children's Privacy */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>8. Children's Privacy</h2>
        <p style={{ marginBottom: '16px' }}>
          Graham is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal data from a child under 13, we will take steps to delete that information promptly. If you believe we may have collected information from a child under 13, please contact us at support@grahamai.com.
        </p>

        {/* 9. Changes to This Privacy Policy */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>9. Changes to This Privacy Policy</h2>
        <p style={{ marginBottom: '16px' }}>
          We may update this Privacy Policy from time to time. If we make material changes, we will notify you by posting the updated policy within the app and updating the "Last Updated" date above. For significant changes, we may also notify you via email or through an in-app notification. Your continued use of the Service after any changes constitutes your acceptance of the updated Privacy Policy.
        </p>

        {/* 10. Contact Us */}
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '32px', marginBottom: '12px' }}>10. Contact Us</h2>
        <p style={{ marginBottom: '16px' }}>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
        </p>
        <p style={{ marginBottom: '32px' }}>
          <strong>Email:</strong> support@grahamai.com
        </p>
      </div>
    </div>
  );
}
