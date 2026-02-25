const fs = require('fs');
const svgData = `
import React from 'react';

export default function InteractivePasuruanMap() {
    return <div>Hello Map Data Test</div>;
}
`;
fs.writeFileSync('src/components/InteractivePasuruanMap.tsx', svgData);
console.log('Done mapping.');
