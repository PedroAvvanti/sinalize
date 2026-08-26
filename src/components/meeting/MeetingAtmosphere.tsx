/** Decorações de fundo — canto técnico + barras de sinal. */
export function MeetingAtmosphere() {
  return (
    <div className="meeting-studio__atmosphere" aria-hidden="true">
      <div className="meeting-studio__glow meeting-studio__glow--a" />
      <div className="meeting-studio__glow meeting-studio__glow--b" />

      {/* Canto de projeto — origem clara, arcos alinhados */}
      <svg
        className="meeting-studio__glyph meeting-studio__glyph--corner"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="meeting-studio__corner-frame"
          d="M12 188 H52 M12 188 V148"
        />
        <path
          className="meeting-studio__corner-arc meeting-studio__corner-arc--1"
          d="M12 188 A56 56 0 0 1 68 132"
        />
        <path
          className="meeting-studio__corner-arc meeting-studio__corner-arc--2"
          d="M12 188 A104 104 0 0 1 116 84"
        />
        <path
          className="meeting-studio__corner-arc meeting-studio__corner-arc--3"
          d="M12 188 A152 152 0 0 1 164 36"
        />
      </svg>

      {/* Barras de sinal — leitura de instrumento, não mira */}
      <svg
        className="meeting-studio__glyph meeting-studio__glyph--bars"
        viewBox="0 0 72 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path className="meeting-studio__bar meeting-studio__bar--1" d="M8 148 V108" />
        <path className="meeting-studio__bar meeting-studio__bar--2" d="M24 148 V72" />
        <path className="meeting-studio__bar meeting-studio__bar--3" d="M40 148 V40" />
        <path className="meeting-studio__bar meeting-studio__bar--4" d="M56 148 V88" />
        <path className="meeting-studio__bar-base" d="M4 152 H68" />
      </svg>
    </div>
  );
}
