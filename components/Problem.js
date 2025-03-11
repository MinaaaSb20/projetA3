import { Clock, XCircle, ArrowRight, Mic, FileText, Headphones, Users, DollarSign, Zap } from "lucide-react";

const Problem = () => {
  return (
    <section className="relative bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 py-24 md:py-32 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 mb-6">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">The Audio Content Gap</span>
          </div>
          
          <h2 className="max-w-3xl mx-auto font-extrabold text-4xl md:text-5xl tracking-tight mb-8">
            <span className="bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
              Why Content Creators Are Losing 
              <span className="relative inline-block mx-2">
                Audience & Revenue
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-red-500 opacity-70" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <path d="M0,0 Q50,12 100,0" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
              Every Day
            </span>
          </h2>
          
          <p className="max-w-2xl mx-auto text-lg text-blue-100/80 leading-relaxed">
            The audio revolution is here, but most content creators are stuck in text-only mode, 
            missing out on the 65% of consumers who prefer audio content.
          </p>
        </div>

        {/* Main Content - Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Audience Loss</h3>
            </div>
            <p className="text-gray-300 mb-4">Content without audio options misses the 1.5 billion podcast listeners worldwide.</p>
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-medium">73% of users skip text-only content</span>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                <Clock className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Time Drain</h3>
            </div>
            <p className="text-gray-300 mb-4">Creating professional audio manually takes 6-8 hours per piece of content.</p>
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-medium">92% abandon due to time constraints</span>
            </div>
          </div>
          
          {/* Card 3 */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Revenue Impact</h3>
            </div>
            <p className="text-gray-300 mb-4">Content with audio options generates 3.5x more engagement and revenue.</p>
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-medium">$10K+ annual revenue missed</span>
            </div>
          </div>
        </div>
        
        {/* Bottom CTA Section */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center justify-center p-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
            <div className="bg-gray-900 rounded-full px-6 py-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span className="text-white font-medium">The solution is simpler than you think</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;