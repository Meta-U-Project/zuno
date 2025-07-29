export const formatMarkdown = (text) => {
    if (!text) return '';

    let formatted = text;

    const lines = formatted.split('\n');
    const processedLines = [];

    for (let line of lines) {
        let processedLine = line;

        if (processedLine.match(/^###\s/)) {
            processedLine = processedLine.replace(/^###\s(.+)$/, '<h3>$1</h3>');
        } else if (processedLine.match(/^##\s/)) {
            processedLine = processedLine.replace(/^##\s(.+)$/, '<h2>$1</h2>');
        } else if (processedLine.match(/^#\s/)) {
            processedLine = processedLine.replace(/^#\s(.+)$/, '<h1>$1</h1>');
        }
        else if (processedLine.match(/^\d+\.\s/)) {
            processedLine = processedLine.replace(/^(\d+)\.\s(.+)$/, '<div class="list-item numbered">$1. $2</div>');
        }
        else if (processedLine.match(/^\*\s/) || processedLine.match(/^-\s/)) {
            processedLine = processedLine.replace(/^[-*]\s(.+)$/, '<div class="list-item bullet">• $1</div>');
        }

        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        processedLine = processedLine.replace(/`(.*?)`/g, '<code>$1</code>');

        if (!processedLine.match(/^<div class="list-item bullet">/)) {
            processedLine = processedLine.replace(/\b\*([^*\s][^*]*[^*\s])\*\b/g, '<em>$1</em>');
            processedLine = processedLine.replace(/\b\*([^*\s]+)\*\b/g, '<em>$1</em>');
        }

        processedLines.push(processedLine);
    }

    formatted = processedLines.join('<br>');

    return formatted;
};
