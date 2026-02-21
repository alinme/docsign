**Prompt:** Design a web application similar to docusign.com, simplified for two users to sign documents. The application should include the following features:

### Core Features

**1. User Roles**
* Implement two user roles: **Initiator** and **Signer**.
* **Initiator:** Creates and sends documents for signing.
* **Signer:** Reviews and signs the documents.

**2. Document Signing Process**
* **Upload & Templates:** The Initiator can upload documents and select templates from a library (e.g., NDAs, real estate contracts, car sale agreements, rental agreements, booking contracts, etc.).
* **Notifications:** The Signer receives a notification to review and sign the document.
* **Mobile Handoff:** Include a QR code feature that allows the Signer to scan a code displayed on the desktop version to seamlessly sign the document on a mobile device.

**3. Dashboard**
* Design a clean and user-friendly dashboard that displays document history alongside current statuses (pending, signed, completed).
* Provide robust filters and search functionality for easy access to previous documents.

**4. Document Templates**
* Create a comprehensive library of customizable templates for various document types.
* Allow users to edit templates with their specific information and save them for future use.

### Technical & Design Requirements

**5. Responsive Design**
* Ensure the application is fully responsive, optimized for both desktop and mobile experiences.
* Utilize a modern technology stack that includes **shadcn/ui** components and **Tailwind CSS v4** for styling.
* Select clear, highly legible fonts for optimal readability across all screen sizes.

**6. Security Features & Compliance**
* Implement strict row-level security and utilize **Encryption in Transit (TLS) and at Rest (AES-256)** to protect document storage and the signing process.
* Build a comprehensive **Audit Trail** that logs IP addresses, timestamps, and exact actions to ensure legally binding signatures.
* Ensure uploaded files are restricted strictly to **PDF format** to enable secure and robust client-side manipulation of final documents.
* Implement a robust expiration policy where unsigned documents automatically void after a set period (e.g., 7 days).

### Experience & Iteration

**7. User Experience Enhancements**
* Offer interactive tooltips and guided onboarding for new users to navigate the application easily.
* Incorporate real-time notifications for document status updates via email or in-app alerts.

**8. Testing and Feedback**
* Develop a plan for user testing to gather actionable feedback on the application’s usability and functionality.
* Utilize this feedback to iteratively improve the user interface and overall experience.

### Expected Deliverables
Deliver a comprehensive plan that includes:
* Wireframes
* User flows
* Technology stack recommendations to achieve the described functionality and design.