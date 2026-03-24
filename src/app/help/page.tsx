export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Help Center</h1>
        
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333]">
            <h2 className="text-xl font-bold text-white mb-4">How to Upload a Video</h2>
            <ol className="text-[#aaa] space-y-2 list-decimal list-inside">
              <li>Login to your account using email or mobile number</li>
              <li>Click on the "Upload" button in the navigation</li>
              <li>Select your video file (MP4, MOV, or AVI)</li>
              <li>Fill in the incident details (Country, City, Road, Date/Time, Incident Type)</li>
              <li>Optionally add vehicle number if visible</li>
              <li>Click "Upload" to submit for review</li>
            </ol>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333]">
            <h2 className="text-xl font-bold text-white mb-4">How Search Works</h2>
            <p className="text-[#aaa] mb-4">
              You can search videos by selecting any <strong className="text-white">2 or more</strong> criteria:
            </p>
            <ul className="text-[#aaa] space-y-1 list-disc list-inside">
              <li>Country</li>
              <li>City</li>
              <li>Road Name</li>
              <li>Incident Type</li>
              <li>Date</li>
            </ul>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333]">
            <h2 className="text-xl font-bold text-white mb-4">Earning Rewards</h2>
            <p className="text-[#aaa] mb-4">
              You earn <strong className="text-[#FFCA28]">100 points</strong> for each video that gets approved by our admin team to make it live on website.
            </p>
            <p className="text-[#aaa] mb-4">
              You earn <strong className="text-[#FFCA28]">100 coins</strong> for each video that gets downloaded by our admin team.
            </p>
            <p className="text-[#aaa]">
              Points contribute to your position on the Leaderboard!
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333]">
            <h2 className="text-xl font-bold text-white mb-4">Video Approval Process</h2>
            <p className="text-[#aaa]">
              All uploaded videos go through a review process by our admin team before being published. 
              This ensures quality content and compliance with our guidelines.
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333]">
            <h2 className="text-xl font-bold text-white mb-4">Contact Support</h2>
            <p className="text-[#aaa]">
              For any issues or questions, please contact us at dcamtube@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
