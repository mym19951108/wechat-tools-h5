const fs = require('fs');
let d = fs.readFileSync('scripts/build-ci.js', 'utf8');

// Load mood scores and use them
d = d.replace(
  "const ciPath = path.join(SCRIPTS_DIR, 'ci.json')",
  "const msPath = path.join(SCRIPTS_DIR, 'mood-heuristic.json');\nconst moodScores = JSON.parse(fs.readFileSync(msPath, 'utf8'));\nconst ciPath = path.join(SCRIPTS_DIR, 'ci.json')"
);
d = d.replace(
  "annotation: explanation.replace(/^\\d+\\./, '')",
  "annotation: explanation.replace(/^\\d+\\./, ''), mood: moodScores[w] || 5"
);
d = d.replace(
  "annotation: r.annotation }",
  "annotation: r.annotation, mood: r.mood }"
);

fs.writeFileSync('scripts/build-ci.js', d);
console.log('Fixed CI build script');
