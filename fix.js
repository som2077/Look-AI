const fs = require('fs');
const p = 'src/app/(root)/calendar.tsx';
let c = fs.readFileSync(p, 'utf8');

const daysReplacement = `
  const days = useMemo(
    () => {
      const year = viewYear;
      const month = viewMonth;
      const firstDay = new Date(year, month, 1);
      const startOffset = firstDay.getDay(); 
      const days = [];
      for (let i = startOffset - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }
      const lastDay = new Date(year, month + 1, 0);
      for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
      }
      const remaining = 7 - (days.length % 7);
      if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
          days.push(new Date(year, month + 1, d));
        }
      }
      return days;
    },
    [viewYear, viewMonth],
  );

  const handleDaySelect = useCallback((date) => {
    setSelected(date);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, []);

  const combinedOutfitsData = loggedOutfitsData;
`;

// First remove my duplicated const MONTH_NAMES etc which I added by mistake at line 238 previously
const badRegex = /const MONTH_NAMES = \[[\s\S]*?\/\/ ─── Main Calendar Screen ─────────────────────────────────────────────────────/g;
c = c.replace(badRegex, '');

// Replace from 'if (supabase) { fetchOutfits(); }' to 'return ( <View'
const regex = /if\s*\(supabase\)\s*\{\s*fetchOutfits\(\);\s*\}[^]*?(?=return\s*\(\s*<View)/m;

c = c.replace(regex, `if (supabase) { fetchOutfits(); }
    return () => { isMounted = false; };
  }, [viewYear, viewMonth, supabase]);

  ` + daysReplacement + `

  `);

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed calendar.tsx!');
