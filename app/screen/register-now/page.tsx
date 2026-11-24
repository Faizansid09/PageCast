"use client";

export default function RegisterNowScreen() {
  return (
    <main className="min-h-screen w-full bg-[#050505] text-white overflow-hidden flex items-center justify-center font-sans">
      <div className="relative w-full min-h-screen flex items-center px-8 py-12 md:px-16 lg:px-[7%]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,rgba(150,30,120,0.09),transparent_55%)]" />

        <div className="relative z-10 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 lg:gap-24 items-center">
          <section className="flex flex-col justify-center">
            <p className="text-sm md:text-base font-semibold text-neutral-400 mb-10">
              A new chapter in campus technology
            </p>

            <h1 className="text-[clamp(4.5rem,8vw,9rem)] font-light tracking-[-0.075em] leading-[0.87]">
              Imagine.
              <br />
              Build.
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#ff248e] via-[#e52ad7] to-[#9254ff]">
                Re:Invent.
              </span>
            </h1>

            <div className="mt-12 max-w-155">
              <p className="text-lg md:text-xl text-neutral-400 leading-[1.95] tracking-tight">
                Five days dedicated to the people who turn curiosity into
                creation. Re:Invent Fest 2026 brings developers, students,
                and innovators together to explore technology, exchange
                ideas, and build what comes next at Lovely Professional
                University.
              </p>
            </div>

            <div className="flex items-center gap-5 mt-10">
              <div className="w-12 h-0.5 bg-linear-to-r from-[#ff248e] to-[#9254ff]" />
              <span className="text-sm md:text-base font-semibold text-neutral-300">
                November 30 to December 4, 2026
              </span>
            </div>
          </section>

          <section className="flex flex-col justify-center lg:pt-24">
            <div className="border-t border-neutral-800 pt-10">
              <p className="text-sm md:text-base font-semibold text-[#ff248e] mb-7">
                The community behind the festival
              </p>

              <h2 className="text-3xl md:text-4xl lg:text-[2.25rem] font-light tracking-tight leading-[1.35]">
                AWS Student
                <br />
                Builder Group{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#ff248e] to-[#9254ff]">
                  · LPU
                </span>
              </h2>

              <div className="mt-7 space-y-6 text-base md:text-lg text-neutral-400 leading-[1.95] tracking-tight">
                <p>
                  We are a student-led technology community at Lovely
                  Professional University, bringing aspiring builders
                  together through hands-on learning, technical sessions,
                  collaborative projects, and community events.
                </p>

                <p>
                  Our goal is simple: help students move beyond tutorials,
                  experiment with emerging technologies, and turn what they
                  learn into things they can actually build.
                </p>
              </div>
            </div>

            <div className="mt-14 border-t border-neutral-800 pt-7 flex items-center justify-between gap-4">
              <span className="text-sm md:text-base font-medium text-neutral-500">
                Built by the community
              </span>

              <span className="text-sm md:text-base font-semibold text-transparent bg-clip-text bg-linear-to-r from-[#ff248e] to-[#9254ff]">
                Made for builders.
              </span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}