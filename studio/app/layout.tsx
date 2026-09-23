import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Front-End Checklist Studio",
  description: "Interactive Front-End Checklist with AI prompt generation and GitHub context.",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
};

const themeBootstrap = `(function(){try{
var raw=localStorage.getItem("fec-theme");if(!raw)return;
var t=JSON.parse(raw);if(!t||typeof t!=="object")return;
var d=[];
function put(n,v){if(typeof v!=="string"||!v)return;if(/[{};]/.test(v))return;d.push(n+":"+v);}
var c={background:"--bg",surface:"--surface",surfaceHover:"--surface-hover",elevated:"--elevated",foreground:"--fg",foregroundMuted:"--fg-muted",foregroundSubtle:"--fg-subtle",border:"--border",borderStrong:"--border-strong",accent:"--accent",accentHover:"--accent-hover",accentForeground:"--accent-fg",critical:"--critical",high:"--high",medium:"--medium",low:"--low",success:"--success",warning:"--warning",ring:"--ring"};
if(t.colors){for(var k in c){if(t.colors[k])put(c[k],t.colors[k]);}}
var f={bricolage:"var(--font-bricolage), ui-sans-serif, system-ui, sans-serif",instrument:"var(--font-instrument), ui-sans-serif, system-ui, sans-serif",jetbrains:"var(--font-jetbrains), ui-monospace, SFMono-Regular, Menlo, monospace",system:"ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",georgia:'Georgia, "Times New Roman", serif'};
var s={display:"--font-display-family",body:"--font-body-family",mono:"--font-mono-family"};
if(t.fonts){for(var q in s){var v=f[t.fonts[q]];if(v)put(s[q],v);}}
if(t.radius)put("--radius",t.radius);
if(t.mode)put("--color-scheme",t.mode);
if(!d.length)return;
var css="html{"+d.join(";")+"}";
var el=document.getElementById("fec-theme-boot");
if(!el){el=document.createElement("style");el.id="fec-theme-boot";el.appendChild(document.createTextNode(css));(document.head||document.documentElement).appendChild(el);}
else{el.textContent=css;}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
