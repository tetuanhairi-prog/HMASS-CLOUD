
export const exportToCSV = (filename: string, headers: string[], data: any[]) => {
  const csvContent = "\ufeff" + [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const val = row[h.toLowerCase()] || "";
      return `"${val.toString().replace(/"/g, '""')}"`;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) return resolve([]);
        
        const headers = lines[0].replace("\ufeff", "").split(",").map(h => h.trim().toLowerCase());
        const result = lines.slice(1).filter(l => l.trim()).map(line => {
          // Robust regex for CSV parsing that handles quotes
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = cols[i];
          });
          return obj;
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
