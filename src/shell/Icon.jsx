/* Menu and top bar icons. 24x24, stroke only, colour follows the text (currentColor). Names match `icon` in lib/perms.js. */
const PATHS = {
  overview: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  'pf-saccos': 'M4 21V8l8-5 8 5v13M9 21v-6h6v6',
  'pf-owners': 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  'pf-access': 'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3',
  audit: 'M8 4h8v3H8zM6 6H5v15h14V6h-1M9 12h6M9 16h6',
  savings: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  deposit: 'M12 3v12M7 10l5 5 5-5M5 20h14',
  withdraw: 'M12 15V3M7 8l5-5 5 5M5 20h14',
  accounts: 'M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2zM9 8h6M9 12h6',
  money: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  requests: 'M4 13l2-8h12l2 8v6H4zM4 13h5l1 2h4l1-2h5',
  loans: 'M5 19L19 5M7 8a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z',
  members: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 6.5M18 14a6.5 6.5 0 013.5 6',
  'add-member': 'M10 11a4 4 0 100-8 4 4 0 000 8zM3 21a7 7 0 0114 0M19 8v6M16 11h6',
  reports: 'M5 20V10M12 20V4M19 20v-7',
  access: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  rules: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
  settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4',
  'my-settings': 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 13a3 3 0 100-6 3 3 0 000 6zM6.5 18.5a6 6 0 0111 0',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  bell: 'M6 16v-5a6 6 0 1112 0v5l2 2H4zM10 21h4',
  chevron: 'M6 9l6 6 6-6',
};

export default function Icon({ name, className = 'size-5 shrink-0' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name] || PATHS.overview} />
    </svg>
  );
}