"use client";

import React from "react";

export default function RegisterNowScreen() {
  return (
    <main className="relative min-h-screen w-full bg-[#050505] text-white overflow-hidden flex items-center px-8 py-12 md:px-16 lg:px-[7%] font-sans">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_45%_20%,rgba(160,25,120,0.13),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-20 items-center">

        <section>
          <p className="text-sm md:text-base font-semibold text-neutral-400 mb-10">
            Re:Invent Fest 2026 · Registration is now open
          </p>

          <h1 className="text-[clamp(4.5rem,8vw,9rem)] font-light tracking-[-0.075em] leading-[0.88]">
            Your next
            <br />
            chapter
            <br />
            starts{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff248e] via-[#e52ad7] to-[#9254ff]">
              here.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-[620px] mt-10">
            Five days of technology, ideas, and building what's next.
            Join developers, students, and innovators at Lovely
            Professional University.
          </p>

          <div className="flex items-center gap-5 mt-10">
            <div className="w-12 h-[2px] bg-gradient-to-r from-[#ff248e] to-[#9254ff]" />
            <span className="text-sm md:text-base font-semibold text-neutral-300">
              November 30 – December 4, 2026
            </span>
          </div>

          <div className="mt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff248e]">
              Don't just hear about it.
            </p>
            <p className="text-2xl md:text-3xl font-light mt-3 tracking-tight">
              Be part of it.
            </p>
          </div>
        </section>

        <section className="flex flex-col items-center lg:items-end">
          <div className="w-full max-w-[430px] border-t border-neutral-800 pt-8">
            <p className="text-sm font-semibold text-[#ff248e] mb-3">
              Your invitation awaits
            </p>

            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Register for
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff248e] to-[#9254ff]">
                Re:Invent 2026.
              </span>
            </h2>

            <p className="text-neutral-400 text-base leading-relaxed mt-5">
              Scan the QR code using your phone camera to explore the
              festival and secure your registration.
            </p>

            <div className="mt-9 flex justify-center">
              <div className="bg-white p-5 rounded-2xl shadow-[0_0_80px_rgba(225,35,180,0.13)]">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://reinvent.awslpu.in"
                  alt="Scan to visit Re:Invent Fest 2026 registration website"
                  className="w-52 h-52 md:w-64 md:h-64"
                />
              </div>
            </div>

            <div className="text-center mt-7">
              <p className="text-sm font-bold tracking-[0.2em] text-white">
                SCAN TO REGISTER
              </p>

              <p className="text-sm text-neutral-500 mt-2">
                reinvent.awslpu.in
              </p>
            </div>

            <div className="mt-10 border-t border-neutral-800 pt-6 flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                Five days. Infinite possibilities.
              </span>

              <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff248e] to-[#9254ff]">
                Made for builders.
              </span>
            </div>
          </div>
        </section>

        <footer className="lg:col-span-2 border-t border-neutral-800 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-neutral-500">
          <span>AWS STUDENT BUILDER GROUP · LPU</span>
          <span>LOVELY PROFESSIONAL UNIVERSITY</span>
          <span>RE:INVENT FEST 2026</span>
        </footer>

      </div>
    </main>
  );
}