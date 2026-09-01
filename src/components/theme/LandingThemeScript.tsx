export function LandingThemeScript() {
  const script = `(function(){try{var stored=localStorage.getItem("sinalize-theme");var theme=stored==="dark"||stored==="light"?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;}catch(e){}})();`;

  return (
    <script
      data-sinalize-landing-theme=""
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
