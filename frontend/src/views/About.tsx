import { Github, Linkedin, Mail, Heart, Code2, Coffee } from 'lucide-react';

export function About() {
  return (
    <div className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-6xl w-full text-center mb-20">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase mb-6 leading-none">
          Built by <span className="text-brand-500 italic px-1">Developers</span> for the Budget Conscious
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          We are 2 Grad students and developers. Living with other students on tight budgets, we know that every cent counts when items are bought in bulk.
        </p>
      </div>

      {/* Story Sections */}
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 mb-24">
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-sharp border border-brand-500/10">
            <Code2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">The Origin Story</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Spliting tax based on the share in the receipts is the only fair way. We used to do that manually on Google Sheets with complex formulas every week. It was tedious, prone to errors, and frankly, a headache.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            To solve our own problem of weekly budgeting and bill splitting, we decided to build <strong>FairShare</strong>. We wanted something that was as fast as a tap and as accurate as a spreadsheet.
          </p>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-sharp border border-brand-500/10">
            <Coffee className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">But it's more...</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            FairShare isn't just for groceries. Going on a trip with friends? Want to split the bill based on the exact food items ordered by each individual?
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-bold text-zinc-900 dark:text-zinc-200">
            You can do that as well. No more "splitting evenly" when someone only ordered a salad.
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-5xl w-full border-t border-zinc-200 dark:border-zinc-800/60 pt-20 pb-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-4">Meet the Team</h2>
          <p className="text-zinc-500 dark:text-zinc-500 uppercase tracking-widest text-[10px] font-bold">The faces behind the code</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Deep's Profile */}
          <div className="group relative bg-white dark:bg-zinc-900/50 backdrop-blur-sm p-8 border border-zinc-200 dark:border-zinc-800/60 transition-all duration-300 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/5">
            <div className="aspect-square w-full mb-6 overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <img 
                src="/assets/team/deep.png" 
                alt="Deep - Developer" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0"
              />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase mb-1">Deep</h3>
            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-4">Co-Founder & Developer</p>
            <div className="flex gap-4">
              <a href="https://github.com/hadessharma" target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/in/deepsharma993/" target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:de.sharma993@gmail.com" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Satwik's Profile */}
          <div className="group relative bg-white dark:bg-zinc-900/50 backdrop-blur-sm p-8 border border-zinc-200 dark:border-zinc-800/60 transition-all duration-300 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/5">
            <div className="aspect-square w-full mb-6 overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <img 
                src="/assets/team/satwik.png" 
                alt="Satwik - Developer" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0"
              />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase mb-1">Satwik</h3>
            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-4">Co-Founder & Developer</p>
            <div className="flex gap-4">
              <a href="https://github.com/satwikm39" target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/in/satwik-mazumdar/" target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:satwikm39@gmail.com" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="mt-20 flex flex-col items-center gap-4 text-zinc-400 dark:text-zinc-600">
        <Heart className="w-5 h-5 fill-zinc-200 dark:fill-zinc-800 stroke-none" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Designed with precision in the budget trenches.</p>
      </div>
    </div>
  );
}
