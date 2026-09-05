#!/usr/bin/env python3
"""
build_pdf_manual.py
-------------------
Compiles TECHNICAL_ARCHITECTURE_AND_DEFENSE_MANUAL.md into an executive,
publication-quality PDF manual using ReportLab.
Features:
- Full Cover Page with SIH26167 metadata, author Prachi Bhalla, and executive summary.
- Running Header & Running Footer with two-pass 'Page X of Y' numbering.
- Distinct Highlighted Callout Boxes for:
  * The 30-Second Spoken Defense Hook (Sky Blue Theme)
  * Why Alternatives Fail (Rose/Crimson Theme)
- Clean typography, styled tables, and formatted ASCII architecture diagrams.
"""

import os
import re
import html
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Preformatted, HRFlowable
)
from reportlab.pdfgen import canvas

SRC_MD = Path("/home/tanmay/.gemini/antigravity-cli/scratch/satquery-ai/TECHNICAL_ARCHITECTURE_AND_DEFENSE_MANUAL.md")
OUT_PDF = Path("/home/tanmay/.gemini/antigravity-cli/scratch/satquery-ai/SATQUERY_AI_TECHNICAL_ARCHITECTURE_AND_DEFENSE_MANUAL.pdf")
BRAIN_PDF = Path("/home/tanmay/.gemini/antigravity-cli/brain/3a189ecd-c0f2-43ff-8f0b-c2cdb7d49934/SATQUERY_AI_TECHNICAL_ARCHITECTURE_AND_DEFENSE_MANUAL.pdf")

# Page Dimensions (A4)
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 40
PRINTABLE_WIDTH = PAGE_WIDTH - (2 * MARGIN)  # 595.27 - 80 = 515.27 pt

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and stamp total page count."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header
        self.drawString(MARGIN, PAGE_HEIGHT - 32, "SatQuery AI — Technical Architecture & 100-Question Judges Defense Manual (SIH26167 · ISRO)")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(MARGIN, PAGE_HEIGHT - 38, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 38)

        # Running Footer
        self.line(MARGIN, 40, PAGE_WIDTH - MARGIN, 40)
        self.drawString(MARGIN, 28, "Author: Prachi Bhalla & Core Engineering Team  |  SatQuery AI (SIH26167)")
        self.drawRightString(PAGE_WIDTH - MARGIN, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def clean_markdown_text(text: str) -> str:
    """Safely converts Markdown inline formatting and LaTeX to ReportLab XML."""
    if not text:
        return ""
        
    # 1. Escape HTML special characters
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    # 2. Math & Scientific symbols
    replacements = {
        r'\eta': 'η', r'\sigma': 'σ', r'\mu': 'μ', r'\Delta': 'Δ',
        r'\times': '×', r'\ge': '≥', r'\le': '≤', r'\approx': '≈',
        r'\to': '→', r'\pi': 'π', r'\epsilon': 'ε', r'\lambda': 'λ',
        r'\rho': 'ρ', r'\omega': 'ω', r'\phi': 'φ', r'\theta': 'θ',
        r'\ll': '≪', r'\gg': '≫', r'\in': '∈', r'\cap': '∩',
        r'\cup': '∪', r'\land': '∧', r'\lor': '∨', r'\neg': '¬',
        r'\min': 'min', r'\max': 'max', r'\log': 'log',
        r'km^2': 'km²', r'm^2': 'm²', r'km^{2}': 'km²', r'm^{2}': 'm²',
        r'\text{km}^2': 'km²', r'\text{m}^2': 'm²', r'\text{km}': 'km', r'\text{m}': 'm',
        r'\text{dB}': 'dB', r'\text{px}': 'px', r'\text{pixels}': 'pixels',
        r'\text{ha}': 'ha', r'\text{Total Area}': 'Total Area',
        r'\text{Water}': 'Water', r'\text{Built-Up}': 'Built-Up', r'\text{Conversion}': 'Conversion',
        r'\text{shadow}': 'shadow', r'\text{canopy}': 'canopy', r'\text{specular}': 'specular'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)

    text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
    # Convert math delimiters $...$ to italic
    text = re.sub(r'\$([^$]+)\$', r'<i>\1</i>', text)
    # Inline code
    text = re.sub(r'`([^`]+)`', r'<font face="Courier" color="#0369a1">\1</font>', text)
    # Bold
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    # Italic
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<i>\1</i>', text)

    return text.strip()


def build_pdf():
    print(f"Reading markdown source from {SRC_MD}...")
    content = SRC_MD.read_text(encoding="utf-8")
    lines = content.splitlines()

    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN + 10,
        bottomMargin=MARGIN + 10,
        title="SatQuery AI — Technical Architecture & 100-Question Judges Defense Manual",
        author="Prachi Bhalla & Core Engineering Team",
        subject="ISRO SIH26167 Technical Defense & System Architecture",
        creator="SatQuery AI Documentation System",
    )

    # Styles
    base_styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#0284c7'),
        alignment=0
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=base_styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=base_styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#0284c7'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Header3',
        parent=base_styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    subbullet_style = ParagraphStyle(
        'SubBulletText',
        parent=body_style,
        leftIndent=24,
        firstLineIndent=-8,
        spaceAfter=2
    )

    hook_style = ParagraphStyle(
        'HookText',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0369a1')
    )

    fail_style = ParagraphStyle(
        'FailText',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#9f1239')
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=base_styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#334155')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=base_styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    story = []

    # =========================================================================
    # 1. EXECUTIVE COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 15))
    # Top badge banner
    badge_table = Table(
        [[Paragraph("<b>OFFICIAL TECHNICAL SPECIFICATION &amp; JUDGES DEFENSE MANUAL</b>", 
                    ParagraphStyle('B', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#0284c7')))]],
        colWidths=[PRINTABLE_WIDTH]
    )
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bae6fd')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER')
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 20))

    story.append(Paragraph("SATQUERY AI", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Unified Multi-Modal Earth Observation &amp; Autonomous Remote Sensing Intelligence Platform", subtitle_style))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0f172a'), spaceAfter=14))

    meta_content = [
        [Paragraph("<b>Problem Statement ID:</b>", body_style), Paragraph("SIH26167 (Space Technology · Software)", body_style)],
        [Paragraph("<b>Target Organization:</b>", body_style), Paragraph("Indian Space Research Organisation (ISRO) / NRSC / Dept of Space", body_style)],
        [Paragraph("<b>Authors &amp; System Architects:</b>", body_style), Paragraph("<b>Prachi Bhalla</b> &amp; Core Engineering Team", body_style)],
        [Paragraph("<b>Architecture Classification:</b>", body_style), Paragraph("Neuro-Symbolic (Decoupled Semantic Reasoner + Classical RS Physics)", body_style)],
        [Paragraph("<b>Primary Evaluation Mission:</b>", body_style), Paragraph("Sentinel-1 C-SAR &amp; Sentinel-2A MSI over Chilika Lake &amp; Mahanadi Delta, Odisha", body_style)],
        [Paragraph("<b>Operational Deployment:</b>", body_style), Paragraph("Zero-Cloud Edge Capable (&lt;150MB RAM, &lt;300ms Latency on Standard CPU)", body_style)],
        [Paragraph("<b>Publication Date:</b>", body_style), Paragraph("September 2026", body_style)]
    ]
    meta_table = Table(meta_content, colWidths=[150, PRINTABLE_WIDTH - 150])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9'))
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 16))

    # Executive Overview Box
    exec_summary_text = (
        "<b>Executive Document Scope:</b><br/>"
        "This master manual serves as the complete technical specification, physical microwave derivation dossier, and "
        "comprehensive 100-Question Defense Guide for the SatQuery AI system competing in the Smart India Hackathon (SIH26167). "
        "It details the exact division of labor between the lightweight LLM semantic agent and deterministic computer vision algorithms "
        "(Otsu histogram separability, connected component geometry, and spectral indexing), provides the formal mathematical proof "
        "behind the empirical confidence scoring engine (including the calibrated refusal benchmark under cloud obscuration), and outlines "
        "the real-world deployment roadmap for ISRO Bhuvan and national disaster management operations."
    )
    exec_table = Table(
        [[Paragraph(exec_summary_text, ParagraphStyle('E', fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor('#1e293b')))]],
        colWidths=[PRINTABLE_WIDTH]
    )
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('LEFTPADDING', (0, 0), (-1, -1), 12)
    ]))
    story.append(exec_table)

    story.append(PageBreak())

    # =========================================================================
    # 2. PARSE MARKDOWN DOCUMENT BODY
    # =========================================================================
    idx = 0
    in_code_block = False
    code_block_lines = []
    in_table = False
    table_lines = []

    def flush_table(t_lines):
        if not t_lines:
            return None
        rows = []
        for line in t_lines:
            if re.match(r'^\s*\|?\s*[-:]+[-| :]*$', line):
                continue  # Separator row
            parts = [p.strip() for p in line.strip().strip('|').split('|')]
            if parts:
                rows.append(parts)
        if not rows:
            return None
        
        col_count = max(len(r) for r in rows)
        # Normalize row lengths
        for r in rows:
            while len(r) < col_count:
                r.append("")
        
        # Build cell paragraphs
        table_data = []
        for r_idx, row in enumerate(rows):
            row_cells = []
            for cell in row:
                st = table_header_style if r_idx == 0 else table_cell_style
                row_cells.append(Paragraph(clean_markdown_text(cell), st))
            table_data.append(row_cells)
            
        col_width = PRINTABLE_WIDTH / col_count
        t = Table(table_data, colWidths=[col_width] * col_count)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        return t

    while idx < len(lines):
        line = lines[idx]
        stripped = line.strip()

        # Handle Code Block Start / End
        if stripped.startswith("```"):
            if in_code_block:
                # End of code block
                in_code_block = False
                raw_code = "\n".join(code_block_lines)
                code_table = Table(
                    [[Preformatted(raw_code, ParagraphStyle('Pre', fontName='Courier', fontSize=6.2, leading=7.5, textColor=colors.HexColor('#f8fafc')))]],
                    colWidths=[PRINTABLE_WIDTH]
                )
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
                    ('PADDING', (0, 0), (-1, -1), 6),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#334155'))
                ]))
                story.append(code_table)
                story.append(Spacer(1, 6))
                code_block_lines = []
            else:
                in_code_block = True
                code_block_lines = []
            idx += 1
            continue

        if in_code_block:
            code_block_lines.append(line)
            idx += 1
            continue

        # Handle Markdown Tables
        if "|" in line and ("---" in line or (idx + 1 < len(lines) and "---" in lines[idx + 1]) or in_table):
            in_table = True
            table_lines.append(line)
            idx += 1
            continue
        elif in_table:
            # Table ended
            in_table = False
            tbl = flush_table(table_lines)
            if tbl:
                story.append(tbl)
                story.append(Spacer(1, 6))
            table_lines = []
            # do not continue, process current line below

        if not stripped:
            idx += 1
            continue

        # Headings
        if stripped.startswith("# PART"):
            story.append(PageBreak())
            story.append(Paragraph(clean_markdown_text(stripped[2:]), h1_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=8))
        elif stripped.startswith("# "):
            story.append(Paragraph(clean_markdown_text(stripped[2:]), h1_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0f172a'), spaceAfter=6))
        elif stripped.startswith("## "):
            story.append(Paragraph(clean_markdown_text(stripped[3:]), h2_style))
        elif stripped.startswith("### Q"):
            # Question Heading
            story.append(Spacer(1, 6))
            q_table = Table(
                [[Paragraph(clean_markdown_text(stripped[4:]), h3_style)]],
                colWidths=[PRINTABLE_WIDTH]
            )
            q_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                ('PADDING', (0, 0), (-1, -1), 4),
                ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1'))
            ]))
            story.append(KeepTogether([q_table, Spacer(1, 3)]))
        elif stripped.startswith("### "):
            story.append(Paragraph(clean_markdown_text(stripped[4:]), h3_style))
            
        # Callout: The 30-Second Spoken Defense Hook
        elif "* **The 30-Second Spoken Defense Hook**:" in stripped or "**The 30-Second Spoken Defense Hook**:" in stripped:
            # Look ahead for quote block
            hook_text = ""
            idx += 1
            while idx < len(lines) and (lines[idx].strip().startswith(">") or not lines[idx].strip().startswith("*")):
                l_s = lines[idx].strip()
                if l_s.startswith(">"):
                    hook_text += " " + l_s.lstrip(">").strip()
                elif l_s.startswith("*") or l_s.startswith("###"):
                    break
                elif l_s:
                    hook_text += " " + l_s
                idx += 1
            
            box_content = (
                "<b>THE 30-SECOND SPOKEN DEFENSE HOOK:</b><br/>"
                f"{clean_markdown_text(hook_text)}"
            )
            hook_box = Table(
                [[Paragraph(box_content, hook_style)]],
                colWidths=[PRINTABLE_WIDTH]
            )
            hook_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('LINELEFT', (0, 0), (-1, -1), 3, colors.HexColor('#0284c7')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bae6fd'))
            ]))
            story.append(KeepTogether([hook_box, Spacer(1, 4)]))
            continue  # Already advanced idx

        # Callout: Why Alternative Approaches Fail
        elif "* **Why Alternatives Fail**:" in stripped or "**Why Alternatives Fail**:" in stripped:
            fail_text = ""
            idx += 1
            while idx < len(lines) and not lines[idx].strip().startswith("---") and not lines[idx].strip().startswith("###"):
                l_s = lines[idx].strip()
                if l_s.startswith("-") or l_s.startswith("*"):
                    fail_text += "<br/>• " + l_s[1:].strip()
                elif l_s:
                    fail_text += " " + l_s
                idx += 1
            
            fail_box_content = (
                "<b>WHY ALTERNATIVE APPROACHES FAIL:</b>"
                f"{clean_markdown_text(fail_text)}"
            )
            fail_box = Table(
                [[Paragraph(fail_box_content, fail_style)]],
                colWidths=[PRINTABLE_WIDTH]
            )
            fail_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff1f2')),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('LINELEFT', (0, 0), (-1, -1), 3, colors.HexColor('#f43f5e')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#fecdd3'))
            ]))
            story.append(KeepTogether([fail_box, Spacer(1, 6)]))
            continue

        # Bullets
        elif stripped.startswith("- ") or stripped.startswith("* "):
            story.append(Paragraph("• " + clean_markdown_text(stripped[2:]), bullet_style))
        elif re.match(r'^\d+\.\s', stripped):
            num = re.match(r'^\d+\.', stripped).group(0)
            txt = stripped[len(num):].strip()
            story.append(Paragraph(f"<b>{num}</b> " + clean_markdown_text(txt), bullet_style))
        elif stripped.startswith("---"):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=6, spaceBefore=6))
        else:
            story.append(Paragraph(clean_markdown_text(stripped), body_style))

        idx += 1

    # End of document
    if table_lines:
        tbl = flush_table(table_lines)
        if tbl:
            story.append(tbl)

    print("Building PDF document with NumberedCanvas...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ PDF successfully compiled at: {OUT_PDF}")

    # Copy to brain artifact directory
    BRAIN_PDF.parent.mkdir(parents=True, exist_ok=True)
    BRAIN_PDF.write_bytes(OUT_PDF.read_bytes())
    print(f"✅ Copied PDF artifact to: {BRAIN_PDF}")

if __name__ == "__main__":
    build_pdf()
