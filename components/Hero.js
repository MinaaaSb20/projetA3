import Image from "next/image";
import TestimonialsAvatars from "./TestimonialsAvatars";
import config from "@/config";
import Link from "next/link";
import hero from "@/app/hero.png";
import { Play, Mic, Headphones, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full border border-blue-500/20 text-blue-500">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI-Powered Audio Conversion</span>
        </div>

        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
          Turn Text into Pro Audio <br className="hidden md:block" />
          <span className="relative">
            in Seconds
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-500 opacity-70" viewBox="0 0 100 12" preserveAspectRatio="none">
              <path d="M0,0 Q50,12 100,0" stroke="currentColor" strokeWidth="3" fill="none" />
            </svg>
          </span>
        </h1>
        
        <p className="text-lg opacity-80 leading-relaxed max-w-xl">
          VocalizAI transforms your written content into professional, engaging audio with natural-sounding voices. Perfect for podcasts, blogs, and content creators.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/openai-demo"
            className="btn btn-primary btn-wide flex items-center justify-center gap-2 shrink-0 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200"
            title={`${config.appName} homepage`}
          >
            <Play className="w-5 h-5" />
            Try {config.appName} 
          </Link>
          
          <Link
            href="/podcast-creaction"
            className="btn btn-outline btn-wide flex items-center justify-center gap-2 shrink-0 px-8 py-4 rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
          >
            <Headphones className="w-5 h-5" />
            Create a Podcast
          </Link>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <p className="text-sm text-gray-600">
            Trusted by content creators, podcasters, and businesses worldwide
          </p>
        </div>
      </div>
      
      <div className="lg:w-full relative">
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
        
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-white text-sm">
            <Mic className="w-4 h-4 text-red-500" />
            <span>Live Recording</span>
          </div>
          
          <Image
            src={hero}
            alt="Professional audio recording studio with microphone and equipment"
            className="w-full rounded-2xl object-cover hover:scale-105 transition-transform duration-700"
            priority={true}
            width={500}
            height={400}
          />
        </div>
        
        <div className="absolute -bottom-5 -left-5 bg-white rounded-lg shadow-xl p-3 border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Converting text to audio...</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;