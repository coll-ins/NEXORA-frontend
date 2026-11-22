const SIGNATURE_FONT = `@font-face{font-family:"Dancing Script";font-style:normal;font-weight:700;font-display:block;src:url(data:font/woff2;base64,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) format("woff2");unicode-range:U+4e,U+61,U+65,U+6f,U+72,U+78}`;

const SIGNATURE_STROKES = [
  ['M112,205 C113.0,197.5 111.7,174.2 118.0,160.0 C124.3,145.8 137.7,129.0 150.0,120.0 C162.3,111.0 186.0,102.7 192.0,106.0 C198.0,109.3 191.3,114.3 186.0,140.0 C180.7,165.7 170.2,221.7 160.0,260.0 C149.8,298.3 135.7,336.7 125.0,370.0 C114.3,403.3 100.8,445.0 96.0,460.0', '0.300', '0.062'],
  ['M206,172 C211.7,198.3 228.0,282.3 240.0,330.0 C252.0,377.7 269.3,443.0 278.0,458.0 C286.7,473.0 284.7,448.0 292.0,420.0 C299.3,392.0 312.0,330.0 322.0,290.0 C332.0,250.0 341.7,211.7 352.0,180.0 C362.3,148.3 378.7,113.3 384.0,100.0', '0.362', '0.096'],
  ['M392,385 C400.0,382.8 423.7,379.5 440.0,372.0 C456.3,364.5 480.0,352.3 490.0,340.0 C500.0,327.7 503.3,310.0 500.0,298.0 C496.7,286.0 482.5,270.2 470.0,268.0 C457.5,265.8 440.8,273.0 425.0,285.0 C409.2,297.0 385.5,320.8 375.0,340.0 C364.5,359.2 360.3,383.3 362.0,400.0 C363.7,416.7 373.7,432.0 385.0,440.0 C396.3,448.0 414.2,450.5 430.0,448.0 C445.8,445.5 465.0,436.3 480.0,425.0 C495.0,413.7 513.3,387.5 520.0,380.0', '0.458', '0.059'],
  ['M520,378 C523.0,372.2 532.2,354.3 538.0,343.0 C543.8,331.7 547.7,318.2 555.0,310.0 C562.3,301.8 573.7,296.3 582.0,294.0 C590.3,291.7 597.7,292.8 605.0,296.0 C612.3,299.2 620.8,303.8 626.0,313.0 C631.2,322.2 633.2,338.7 636.0,351.0 C638.8,363.3 639.8,376.7 643.0,387.0 C646.2,397.3 650.0,408.0 655.0,413.0 C660.0,418.0 666.2,418.5 673.0,417.0 C679.8,415.5 688.3,411.5 696.0,404.0 C703.7,396.5 712.7,380.3 719.0,372.0 C725.3,363.7 731.5,357.0 734.0,354.0', '0.517', '0.050'],
  ['M542,451 C546.2,445.7 556.5,431.5 567.0,419.0 C577.5,406.5 593.3,388.2 605.0,376.0 C616.7,363.8 625.7,357.0 637.0,346.0 C648.3,335.0 661.7,320.3 673.0,310.0 C684.3,299.7 699.7,288.3 705.0,284.0', '0.573', '0.031'],
  ['M822,272 C813.7,276.5 786.7,288.2 772.0,299.0 C757.3,309.8 743.5,323.8 734.0,337.0 C724.5,350.2 718.3,365.8 715.0,378.0 C711.7,390.2 711.8,400.7 714.0,410.0 C716.2,419.3 721.7,428.7 728.0,434.0 C734.3,439.3 743.7,442.5 752.0,442.0 C760.3,441.5 769.7,437.3 778.0,431.0 C786.3,424.7 795.7,412.3 802.0,404.0 C808.3,395.7 813.7,384.8 816.0,381.0', '0.610', '0.056'],
  ['M846,272 C847.2,275.5 853.3,284.2 853.0,293.0 C852.7,301.8 846.0,314.3 844.0,325.0 C842.0,335.7 839.8,349.0 841.0,357.0 C842.2,365.0 845.3,369.7 851.0,373.0 C856.7,376.3 867.2,378.7 875.0,377.0 C882.8,375.3 891.2,371.2 898.0,363.0 C904.8,354.8 910.5,338.7 916.0,328.0 C921.5,317.3 926.7,309.3 931.0,299.0 C935.3,288.7 940.2,271.5 942.0,266.0', '0.666', '0.053'],
  ['M942,260 C943.8,265.3 950.7,282.3 953.0,292.0 C955.3,301.7 957.3,307.2 956.0,318.0 C954.7,328.8 947.3,344.0 945.0,357.0 C942.7,370.0 941.3,384.8 942.0,396.0 C942.7,407.2 943.0,417.2 949.0,424.0 C955.0,430.8 968.0,436.0 978.0,437.0 C988.0,438.0 998.7,435.0 1009.0,430.0 C1019.3,425.0 1031.2,415.5 1040.0,407.0 C1048.8,398.5 1056.2,387.7 1062.0,379.0 C1067.8,370.3 1072.8,359.0 1075.0,355.0', '0.719', '0.059'],
  ['M945,284 C949.7,286.3 964.8,292.3 973.0,298.0 C981.2,303.7 990.0,311.0 994.0,318.0 C998.0,325.0 998.2,331.7 997.0,340.0 C995.8,348.3 989.8,358.7 987.0,368.0 C984.2,377.3 981.2,388.0 980.0,396.0 C978.8,404.0 978.3,412.3 980.0,416.0 C981.7,419.7 988.3,417.7 990.0,418.0', '0.777', '0.031'],
  ['M1214,311 C1212.5,307.8 1211.3,297.0 1205.0,292.0 C1198.7,287.0 1188.5,280.5 1176.0,281.0 C1163.5,281.5 1144.3,286.5 1130.0,295.0 C1115.7,303.5 1101.3,318.8 1090.0,332.0 C1078.7,345.2 1068.7,361.5 1062.0,374.0 C1055.3,386.5 1050.0,396.3 1050.0,407.0 C1050.0,417.7 1056.2,431.5 1062.0,438.0 C1067.8,444.5 1076.0,447.0 1085.0,446.0 C1094.0,445.0 1105.8,439.0 1116.0,432.0 C1126.2,425.0 1137.2,413.7 1146.0,404.0 C1154.8,394.3 1161.0,385.2 1169.0,374.0 C1177.0,362.8 1188.5,340.8 1194.0,337.0 C1199.5,333.2 1201.8,344.8 1202.0,351.0 C1202.2,357.2 1197.5,366.5 1195.0,374.0 C1192.5,381.5 1187.7,388.2 1187.0,396.0 C1186.3,403.8 1187.0,414.7 1191.0,421.0 C1195.0,427.3 1203.5,434.5 1211.0,434.0 C1218.5,433.5 1227.2,426.7 1236.0,418.0 C1244.8,409.3 1257.0,392.5 1264.0,382.0 C1271.0,371.5 1275.7,359.5 1278.0,355.0', '0.808', '0.112'],
];

function Signature({ duration, sequence }) {
  return (
    <div key={sequence} className="sig-wrap go" style={{ '--sig-dur': duration }}>
      <div className="coin-stage">
        <svg className="logo-big" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="url(#lg-disc)" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#lg-ring)" strokeWidth="3.2" />
          <g filter="url(#lg-sh)">
            <path d="M29 71V29h11v42z" fill="url(#lg-face)" />
            <path d="M29 29h11l31 42H60z" fill="url(#lg-diag)" />
            <path d="M60 29h11v42H60z" fill="url(#lg-face)" />
          </g>
          <path d="M40 29l8.5 11.5H40z" fill="#000" opacity=".2" />
          <ellipse cx="38" cy="26" rx="27" ry="14" fill="url(#lg-gloss)" transform="rotate(-20 38 26)" />
          <g className="orbit"><circle cx="50" cy="4" r="4.4" fill="var(--saffron)" /></g>
        </svg>
      </div>
      <svg className="sig-svg" viewBox="60 70 1260 440" aria-hidden="true">
        <defs>
          <mask id="pen" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="600">
            <g id="pen-g" fill="none" stroke="#fff" strokeWidth="96" strokeLinecap="round" strokeLinejoin="round">
              {SIGNATURE_STROKES.map(([path, start, durationPart]) => (
                <path
                  key={path.slice(0, 20)}
                  pathLength="1"
                  d={path}
                  style={{
                    '--s': `calc(var(--sig-dur) * ${start})`,
                    '--d': `calc(var(--sig-dur) * ${durationPart})`,
                  }}
                />
              ))}
            </g>
          </mask>
        </defs>
        <text
          mask="url(#pen)"
          x="60"
          y="430"
          fontFamily="'Dancing Script', 'Segoe Script', cursive"
          fontWeight="700"
          fontSize="460"
          fill="var(--ring-a)"
        >
          Nexora
        </text>
      </svg>
      <svg className="flourish" viewBox="0 0 400 40" aria-hidden="true">
        <path pathLength="1" d="M10 26 C 90 6, 170 38, 250 20 S 360 12, 392 24" />
      </svg>
    </div>
  );
}

function Edge({ top }) {
  return (
    <svg
      className={`edge ${top ? 'top' : 'bot'}`}
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        style={{ fill: top ? 'var(--cur-1)' : 'var(--cur-3)' }}
        d="M0,45 C240,0 480,90 720,45 C960,0 1200,90 1440,45 L1440,90 L0,90 Z"
      />
    </svg>
  );
}

export default function Intro({ phase, sequence, curtainRef }) {
  const isIntro = phase === 'intro';
  const isIdle = phase === 'idle';
  const isReducedCover = phase === 'reduced-cover';
  const curtainClass = isIntro
    ? 'curtain cover'
    : isIdle
      ? 'curtain reset'
      : isReducedCover || phase === 'reduced-reveal'
        ? 'curtain reset'
        : phase === 'exit'
          ? 'curtain run cover exit'
          : 'curtain run cover';
  const signatureDuration = isIntro ? '3.5s' : '1.7s';

  return (
    <>
      <style>{SIGNATURE_FONT}</style>
      <div
        ref={curtainRef}
        className={curtainClass}
        style={{
          '--sig-dur': signatureDuration,
        }}
        aria-hidden="true"
      >
        <Edge top />
        <Signature duration={signatureDuration} sequence={sequence} />
        <Edge top={false} />
      </div>
    </>
  );
}
