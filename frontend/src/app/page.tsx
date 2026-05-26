export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-3xl font-bold text-gray-100">Overview</h2>
        <p className="text-gray-400 mt-2">Welcome to your AI Influencer automation dashboard.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">
          <h3 className="text-gray-400 text-sm font-medium">Total Videos</h3>
          <p className="text-4xl font-bold text-gray-100 mt-2">12</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">
          <h3 className="text-gray-400 text-sm font-medium">Pending Approval</h3>
          <p className="text-4xl font-bold text-yellow-400 mt-2">3</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg">
          <h3 className="text-gray-400 text-sm font-medium">Published This Week</h3>
          <p className="text-4xl font-bold text-green-400 mt-2">5</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-100 mb-4">Recent Generations</h3>
        <div className="space-y-4">
          {/* Placeholder for recent videos */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500">Thumb</span>
              </div>
              <div>
                <p className="font-medium text-gray-200">Dancing in Paris</p>
                <p className="text-sm text-gray-400">Generated 2 hours ago</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full font-medium">
              Needs Approval
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
