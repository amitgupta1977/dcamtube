export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Disclaimer</h1>
        
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Content Purpose</h2>
            <p className="text-[#aaa] leading-relaxed">
              The videos uploaded on GoDashReel are submitted by users and are intended for informational 
              and awareness purposes only. We do not verify the accuracy or completeness of the content 
              in these videos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Not Legal Evidence</h2>
            <p className="text-[#aaa] leading-relaxed">
              Videos uploaded on this platform should NOT be considered as legal evidence in any court 
              of law. For any legal matters, please consult with appropriate legal authorities and follow 
              proper legal procedures.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Privacy & Consent</h2>
            <p className="text-[#aaa] leading-relaxed">
              Users are responsible for ensuring they have proper consent before filming any person or 
              vehicle. We do not tolerate invasion of privacy or harassment content.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Vehicle Number Plates</h2>
            <p className="text-[#aaa] leading-relaxed">
              Vehicle number plates visible in videos are shared publicly. Original videos with 
              clear number plates are only accessible to administrators and may be shared with 
              law enforcement agencies upon legitimate request.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Third-Party API Usage</h2>
            <p className="text-[#aaa] leading-relaxed">
              Third-party vendors using our APIs are responsible for obtaining necessary consents 
              from their users before uploading content to our platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Content Moderation</h2>
            <p className="text-[#aaa] leading-relaxed">
              We reserve the right to remove any content that violates our terms of service, 
              promotes illegal activities, or is deemed inappropriate.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Liability</h2>
            <p className="text-[#aaa] leading-relaxed">
              GoDashReel shall not be liable for any damages arising from the use or misuse of 
              content uploaded by users on this platform.
            </p>
          </div>

          <div className="pt-4 border-t border-[#333]">
            <p className="text-[#666] text-sm">
              Last updated: February 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
