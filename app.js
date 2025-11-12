let isPreviewMode = false;

async function fetchFromUrl() {
    const urlInput = document.getElementById('url-input').value.trim();
    const htmlInput = document.getElementById('html-input');
    const markdownOutput = document.getElementById('markdown-output');
    const copyBtn = document.getElementById('copy-btn');
    const previewBtn = document.getElementById('preview-btn');
    const fetchBtn = document.querySelector('button[onclick="fetchFromUrl()"]');

    if (!urlInput) {
        showStatus('Please enter a URL', 'error');
        return;
    }

    // Validate URL format
    try {
        new URL(urlInput);
    } catch (e) {
        showStatus('Please enter a valid URL', 'error');
        return;
    }

    // Disable button and show loading
    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching...';
    showStatus('Fetching content from URL...', 'success');

    try {
        console.log('Fetching URL:', urlInput);

        // Use codetabs proxy (the one that works)
        const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=';
        const fullUrl = proxyUrl + encodeURIComponent(urlInput);

        const response = await fetch(fullUrl);
        console.log('Response received:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        console.log('HTML length received:', html.length);

        if (!html || html.length === 0) {
            throw new Error('No content received from URL');
        }

        htmlInput.value = html;

        // Automatically convert
        const markdown = convertHtmlToMd(html);
        console.log('Markdown length:', markdown.length);

        markdownOutput.value = markdown;
        copyBtn.disabled = false;
        previewBtn.disabled = false;

        // Reset preview mode if it was active
        if (isPreviewMode) {
            isPreviewMode = false;
            document.getElementById('markdown-output').style.display = 'block';
            document.getElementById('markdown-preview').style.display = 'none';
            previewBtn.textContent = '👁️ Preview';
        }

        showStatus('✓ Fetched and converted successfully!', 'success');
    } catch (error) {
        showStatus('✗ Error: ' + error.message, 'error');
        console.error('Fetch error details:', error);
    } finally {
        // Re-enable button
        fetchBtn.disabled = false;
        fetchBtn.textContent = 'Fetch & Convert';
    }
}

function convert() {
    const htmlInput = document.getElementById('html-input').value;
    const markdownOutput = document.getElementById('markdown-output');
    const copyBtn = document.getElementById('copy-btn');
    const previewBtn = document.getElementById('preview-btn');

    if (!htmlInput.trim()) {
        showStatus('Please enter some HTML to convert', 'error');
        return;
    }

    try {
        const markdown = convertHtmlToMd(htmlInput);
        markdownOutput.value = markdown;
        copyBtn.disabled = false;
        previewBtn.disabled = false;

        // Reset preview mode if it was active
        if (isPreviewMode) {
            isPreviewMode = false;
            document.getElementById('markdown-output').style.display = 'block';
            document.getElementById('markdown-preview').style.display = 'none';
            previewBtn.textContent = '👁️ Preview';
        }

        showStatus('Conversion successful!', 'success');
    } catch (error) {
        showStatus('Error during conversion: ' + error.message, 'error');
        console.error('Conversion error:', error);
    }
}

function togglePreview() {
    const markdownOutput = document.getElementById('markdown-output');
    const markdownPreview = document.getElementById('markdown-preview');
    const previewBtn = document.getElementById('preview-btn');

    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        // Show preview
        const markdown = markdownOutput.value;
        const html = convertMarkdownToHtml(markdown);
        markdownPreview.innerHTML = html;

        markdownOutput.style.display = 'none';
        markdownPreview.style.display = 'block';
        previewBtn.textContent = '📝 Edit';
    } else {
        // Show raw markdown
        markdownOutput.style.display = 'block';
        markdownPreview.style.display = 'none';
        previewBtn.textContent = '👁️ Preview';
    }
}

function convertMarkdownToHtml(markdown) {
    let html = markdown;

    // Convert tables
    html = convertMarkdownTablesToHtml(html);

    // Convert headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');

    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Convert lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convert paragraphs (text not in other tags)
    const lines = html.split('\n');
    let inList = false;
    let inTable = false;
    html = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';

        if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed === '</ul>' || trimmed.startsWith('<table') || trimmed === '</table>') {
            if (trimmed === '<ul>') inList = true;
            if (trimmed === '</ul>') inList = false;
            if (trimmed.startsWith('<table')) inTable = true;
            if (trimmed === '</table>') inTable = false;
            return trimmed;
        }

        if (inList || inTable) return trimmed;

        return `<p>${trimmed}</p>`;
    }).join('\n');

    return html;
}

function convertMarkdownTablesToHtml(markdown) {
    const lines = markdown.split('\n');
    let result = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        // Detect table (line with pipes)
        if (line.startsWith('|') && line.endsWith('|')) {
            let tableLines = [];

            // Collect all table lines
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                tableLines.push(lines[i].trim());
                i++;
            }

            // Convert table to HTML
            if (tableLines.length > 0) {
                let tableHtml = '<table>\n';
                let isFirstRow = true;
                let isSeparatorRow = false;

                for (let tableRow of tableLines) {
                    // Check if this is a separator row (contains only |, -, and spaces)
                    if (/^\|[\s\-|]+\|$/.test(tableRow)) {
                        isSeparatorRow = true;
                        continue; // Skip separator row
                    }

                    // Parse cells
                    const cells = tableRow.split('|')
                        .slice(1, -1) // Remove first and last empty elements
                        .map(cell => cell.trim());

                    // First row after separator detection is header
                    if (isFirstRow && !isSeparatorRow) {
                        tableHtml += '<thead>\n<tr>\n';
                        cells.forEach(cell => {
                            tableHtml += `<th>${cell}</th>\n`;
                        });
                        tableHtml += '</tr>\n</thead>\n<tbody>\n';
                        isFirstRow = false;
                    } else if (!isFirstRow || isSeparatorRow) {
                        // Data rows
                        if (isSeparatorRow && isFirstRow) {
                            // First row was actually header
                            tableHtml += '<tbody>\n';
                            isSeparatorRow = false;
                            isFirstRow = false;
                            continue;
                        }
                        tableHtml += '<tr>\n';
                        cells.forEach(cell => {
                            tableHtml += `<td>${cell}</td>\n`;
                        });
                        tableHtml += '</tr>\n';
                    }
                }

                tableHtml += '</tbody>\n</table>\n';
                result.push(tableHtml);
            }
        } else {
            result.push(lines[i]);
            i++;
        }
    }

    return result.join('\n');
}

function copyToClipboard() {
    const markdownOutput = document.getElementById('markdown-output');

    if (!markdownOutput.value) {
        showStatus('Nothing to copy', 'error');
        return;
    }

    markdownOutput.select();
    document.execCommand('copy');

    // Also use modern clipboard API if available
    if (navigator.clipboard) {
        navigator.clipboard.writeText(markdownOutput.value)
            .then(() => {
                showStatus('Copied to clipboard!', 'success');
            })
            .catch(err => {
                showStatus('Copied to clipboard!', 'success');
            });
    } else {
        showStatus('Copied to clipboard!', 'success');
    }
}

function clearAll() {
    document.getElementById('html-input').value = '';
    document.getElementById('markdown-output').value = '';
    document.getElementById('copy-btn').disabled = true;
    document.getElementById('preview-btn').disabled = true;

    // Reset preview mode
    if (isPreviewMode) {
        isPreviewMode = false;
        document.getElementById('markdown-output').style.display = 'block';
        document.getElementById('markdown-preview').style.display = 'none';
        document.getElementById('preview-btn').textContent = '👁️ Preview';
    }

    showStatus('Cleared all fields', 'success');
}

function showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = 'status-message show ' + type;

    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 3000);
}

// Allow Enter key in textarea (multiline)
// But also allow Ctrl+Enter to trigger conversion
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('html-input').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            convert();
        }
    });
});
