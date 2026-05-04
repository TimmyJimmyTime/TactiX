import jsPDF from 'jspdf'

// ── PNG export ────────────────────────────────────────────────────────────────
export function exportPNG(stage, boardName, phaseName) {
  if (!stage) return
  const dataURL = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' })
  const date = new Date().toISOString().slice(0, 10)
  const fileName = `${sanitize(boardName)}-${sanitize(phaseName)}-${date}.png`
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataURL
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ── PDF export ────────────────────────────────────────────────────────────────
export function exportPDF(stage, boardName, phaseName) {
  if (!stage) return

  const imgData = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.92 })
  const sw = stage.width()
  const sh = stage.height()

  // Add 80px header space above the field
  const headerH = 80
  const pdfW = sw + 40  // 20px padding each side
  const pdfH = sh + headerH + 20

  const pdf = new jsPDF({
    orientation: pdfH > pdfW ? 'portrait' : 'landscape',
    unit: 'px',
    format: [pdfW, pdfH],
    hotfixes: ['px_scaling'],
  })

  // Header
  pdf.setFillColor(26, 29, 39)  // panel color
  pdf.rect(0, 0, pdfW, headerH, 'F')

  pdf.setFontSize(20)
  pdf.setTextColor(174, 234, 0)  // lime
  pdf.text('TactiX', 20, 28)

  pdf.setFontSize(14)
  pdf.setTextColor(255, 255, 255)
  pdf.text(boardName, 20, 50)

  pdf.setFontSize(10)
  pdf.setTextColor(160, 160, 160)
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  pdf.text(`${phaseName.toUpperCase()} · ${date}`, 20, 66)

  // Field image
  pdf.addImage(imgData, 'JPEG', 20, headerH, sw, sh)

  const fileName = `${sanitize(boardName)}-${sanitize(phaseName)}-${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(fileName)
}

// ── Multi-page PDF (all phases) ───────────────────────────────────────────────
export function exportFullPDF(stages, boardName) {
  // stages = [{ phase, phaseName, dataURL }]
  if (!stages.length) return

  const first = stages[0]
  const sw = first.width
  const sh = first.height
  const headerH = 80
  const pdfW = sw + 40
  const pdfH = sh + headerH + 20

  const pdf = new jsPDF({
    orientation: pdfH > pdfW ? 'portrait' : 'landscape',
    unit: 'px',
    format: [pdfW, pdfH],
    hotfixes: ['px_scaling'],
  })

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  stages.forEach(({ phaseName, dataURL }, i) => {
    if (i > 0) pdf.addPage()

    pdf.setFillColor(26, 29, 39)
    pdf.rect(0, 0, pdfW, headerH, 'F')

    pdf.setFontSize(20)
    pdf.setTextColor(174, 234, 0)
    pdf.text('TactiX', 20, 28)

    pdf.setFontSize(14)
    pdf.setTextColor(255, 255, 255)
    pdf.text(boardName, 20, 50)

    pdf.setFontSize(10)
    pdf.setTextColor(160, 160, 160)
    pdf.text(`${phaseName.toUpperCase()} · ${date}`, 20, 66)

    pdf.addImage(dataURL, 'JPEG', 20, headerH, sw, sh)
  })

  const fileName = `${sanitize(boardName)}-playbook-${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(fileName)
}

function sanitize(str) {
  return (str || 'tactix').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
}
