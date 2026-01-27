"use client";

import { useEffect, useState } from "react";

const aiLogLines = [
  { text: "> Scanning repository...", type: "command" },
  { text: "✔ Detected Laravel 10", type: "success" },
  { text: "✔ Found Service Layer", type: "success" },
  { text: "✔ Found Actions pattern", type: "success" },
  { text: "✔ Database: MySQL", type: "success" },
  { text: "✔ Queue: Redis", type: "success" },
  { text: "✔ Tests: PHPUnit", type: "success" },
  { text: "", type: "empty" },
  { text: "> Ready to assist.", type: "ready" },
];

const convictionStatements = [
  "Built exclusively for Laravel. No framework guessing.",
  "Respects your architecture.",
  "No unnecessary abstractions.",
  "Clean diffs. Predictable output.",
];

function AIActivityPanel() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (visibleLines < aiLogLines.length) {
      const delay = visibleLines === 0 ? 500 : 400;
      const timer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span className="ai-pulse" />
        <span className="text-xs text-text-secondary">AI Active</span>
      </div>
      <div className="ai-panel-content">
        {aiLogLines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`ai-line ${line.type} animate-fade-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {line.type === "success" && (
              <span className="text-status-success">{line.text.slice(0, 1)}</span>
            )}
            {line.type === "success" ? line.text.slice(1) : line.text}
          </div>
        ))}
        {visibleLines >= aiLogLines.length && (
          <span className={`ai-cursor ${showCursor ? "opacity-100" : "opacity-0"}`}>
            _
          </span>
        )}
      </div>
    </div>
  );
}

function AnimatedSteps() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { num: "01", title: "Connect GitHub", desc: "Read-only access to your repositories" },
    { num: "02", title: "Select Laravel Repository", desc: "AI scans your codebase structure" },
    { num: "03", title: "Build with AI", desc: "Generate, refactor, fix — Laravel-native" },
  ];

  return (
    <div className="steps-container">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`step-card ${activeStep === i ? "active" : ""}`}
          onMouseEnter={() => setActiveStep(i)}
        >
          <span className="step-num">{step.num}</span>
          <h3 className="step-title">{step.title}</h3>
          <p className="step-desc">{step.desc}</p>
          <div className={`step-indicator ${activeStep === i ? "active" : ""}`} />
        </div>
      ))}
    </div>
  );
}

function ConvictionSection() {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const interval = setInterval(() => {
            setVisibleItems((prev) => {
              if (prev >= convictionStatements.length) {
                clearInterval(interval);
                return prev;
              }
              return prev + 1;
            });
          }, 300);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById("conviction-section");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <div id="conviction-section" className="conviction-grid">
      {convictionStatements.map((statement, i) => (
        <div
          key={i}
          className={`conviction-item ${i < visibleItems ? "visible" : ""}`}
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          {statement}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="header-sticky">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-md text-text-primary font-medium">Laravel AI</span>
            <span className="ai-status">
              <span className="ai-status-dot" />
              <span className="text-xs text-text-muted">Analyzing context…</span>
            </span>
          </div>
          <a href="/auth" className="btn btn-primary text-sm">
            Continue with GitHub →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div className={`hero-content ${mounted ? "animate-in" : ""}`}>
            <h1 className="hero-headline">
              Laravel AI that understands your codebase.
            </h1>
            <p className="hero-subheadline">
              Build, refactor, and fix Laravel applications using an AI trained on
              Laravel conventions — not generic code.
            </p>
            <div className="hero-cta">
              <a href="/auth" className="btn btn-primary btn-lg">
                Continue with GitHub →
              </a>
              <p className="text-xs text-text-muted mt-3">
                No signup. No email. Read-only access.
              </p>
            </div>
          </div>

          {/* Right - AI Panel */}
          <div className={`hero-panel ${mounted ? "animate-in-delayed" : ""}`}>
            <AIActivityPanel />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-surface">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="section-title">How It Works</h2>
          <AnimatedSteps />
        </div>
      </section>

      {/* Why This Tool */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title">Why This Tool</h2>
          <ConvictionSection />
        </div>
      </section>

      {/* Code Preview */}
      <section className="section-surface">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="section-title">Clean Output</h2>
          <div className="code-panel">
            <div className="code-panel-header">
              <span className="code-dot red" />
              <span className="code-dot yellow" />
              <span className="code-dot green" />
              <span className="text-xs text-text-muted ml-3">CreateOrderAction.php</span>
            </div>
            <div className="code-block">
              <pre>
                <code>
                  <span className="token-keyword">class</span>{" "}
                  <span className="token-class">CreateOrderAction</span>
                  {"\n"}
                  {"{"}
                  {"\n"}
                  {"    "}
                  <span className="token-keyword">public function</span>{" "}
                  <span className="token-function">execute</span>(
                  <span className="token-class">OrderData</span>{" "}
                  <span className="token-variable">$data</span>):{" "}
                  <span className="token-class">Order</span>
                  {"\n"}
                  {"    "}
                  {"{"}
                  {"\n"}
                  {"        "}
                  <span className="token-keyword">return</span>{" "}
                  <span className="token-class">DB</span>::
                  <span className="token-function">transaction</span>(
                  <span className="token-keyword">fn</span>() =&gt;
                  {"\n"}
                  {"            "}
                  <span className="token-variable">$this</span>-&gt;
                  <span className="token-function">createOrder</span>(
                  <span className="token-variable">$data</span>)
                  {"\n"}
                  {"                "}-&gt;
                  <span className="token-function">attachItems</span>(
                  <span className="token-variable">$data</span>-&gt;items)
                  {"\n"}
                  {"                "}-&gt;
                  <span className="token-function">notify</span>()
                  {"\n"}
                  {"        );"}
                  {"\n"}
                  {"    "}
                  {"}"}
                  {"\n"}
                  {"}"}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className={`final-cta ${mounted ? "animate-in" : ""}`}>
          <a href="/auth" className="btn btn-primary btn-xl">
            Start with GitHub →
          </a>
          <p className="text-sm text-text-muted mt-4">
            Built for Laravel developers who care about clean code.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border-subtle mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-text-muted">
          <span>Laravel AI Tool</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
