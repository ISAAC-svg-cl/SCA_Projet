import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable,
    Preformatted, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# Register CJK font for any accented/special characters
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))

OUTPUT = "/workspace/app-ehusx188iha9/tasks/SCA_Code_Source.pdf"
APP_ROOT = "/workspace/app-ehusx188iha9"

# Files to include (ordered logically)
FILES = [
    # Config
    ("index.html",           "Configuration"),
    ("tailwind.config.js",   "Configuration"),
    ("vite.config.ts",       "Configuration"),
    ("tsconfig.json",        "Configuration"),
    ("public/manifest.json", "Configuration / PWA"),
    ("public/sw.js",         "Configuration / PWA"),
    # Types & DB
    ("src/types/index.ts",        "Types & Base de données"),
    ("src/db/supabase.ts",        "Types & Base de données"),
    # Contexts
    ("src/contexts/CartContext.tsx",  "Contextes React"),
    ("src/contexts/AuthContext.tsx",  "Contextes React"),
    # Services & Lib
    ("src/services/api.ts",       "Services & Utilitaires"),
    ("src/lib/helpers.ts",        "Services & Utilitaires"),
    ("src/lib/pdfGenerator.ts",   "Services & Utilitaires"),
    ("src/lib/utils.ts",          "Services & Utilitaires"),
    # App shell
    ("src/App.tsx",               "Application Shell"),
    ("src/routes.tsx",            "Application Shell"),
    ("src/main.tsx",              "Application Shell"),
    ("src/index.css",             "Application Shell"),
    # Layouts & Components
    ("src/components/layouts/Navbar.tsx",      "Composants & Layouts"),
    ("src/components/layouts/Footer.tsx",      "Composants & Layouts"),
    ("src/components/layouts/MainLayout.tsx",  "Composants & Layouts"),
    ("src/components/ProductCard.tsx",         "Composants & Layouts"),
    ("src/components/dropzone.tsx",            "Composants & Layouts"),
    # Public pages
    ("src/pages/HomePage.tsx",         "Pages Publiques"),
    ("src/pages/BoutiquePage.tsx",     "Pages Publiques"),
    ("src/pages/ProductDetailPage.tsx","Pages Publiques"),
    ("src/pages/CartPage.tsx",         "Pages Publiques"),
    ("src/pages/ServicesPage.tsx",     "Pages Publiques"),
    ("src/pages/DevisPage.tsx",        "Pages Publiques"),
    ("src/pages/ContactPage.tsx",      "Pages Publiques"),
    ("src/pages/ConseilPage.tsx",      "Pages Publiques"),
    # Admin pages
    ("src/pages/admin/AdminLoginPage.tsx",  "Espace Administrateur"),
    ("src/pages/admin/AdminLayout.tsx",     "Espace Administrateur"),
    ("src/pages/admin/AdminDashboard.tsx",  "Espace Administrateur"),
    ("src/pages/admin/AdminProducts.tsx",   "Espace Administrateur"),
    ("src/pages/admin/AdminStock.tsx",      "Espace Administrateur"),
    ("src/pages/admin/AdminOrders.tsx",     "Espace Administrateur"),
    ("src/pages/admin/AdminInvoices.tsx",   "Espace Administrateur"),
    ("src/pages/admin/AdminQuotes.tsx",     "Espace Administrateur"),
    ("src/pages/admin/AdminClients.tsx",    "Espace Administrateur"),
]

doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2.5*cm, bottomMargin=2.5*cm,
    title="SCA – Code Source Complet",
    author="Société du Courant Alternatif"
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle('SCATitle', parent=styles['Title'],
    fontName='STSong-Light', fontSize=26, textColor=colors.HexColor('#c0201a'),
    spaceAfter=8, alignment=TA_CENTER)

subtitle_style = ParagraphStyle('SCASubtitle', parent=styles['Normal'],
    fontName='STSong-Light', fontSize=12, textColor=colors.HexColor('#1D3557'),
    spaceAfter=4, alignment=TA_CENTER)

section_style = ParagraphStyle('Section', parent=styles['Heading1'],
    fontName='STSong-Light', fontSize=15, textColor=colors.HexColor('#1D3557'),
    spaceBefore=18, spaceAfter=6, borderPad=4)

filename_style = ParagraphStyle('Filename', parent=styles['Heading2'],
    fontName='STSong-Light', fontSize=11, textColor=colors.HexColor('#c0201a'),
    spaceBefore=14, spaceAfter=4)

meta_style = ParagraphStyle('Meta', parent=styles['Normal'],
    fontName='STSong-Light', fontSize=8, textColor=colors.HexColor('#555555'),
    spaceAfter=4)

code_style = ParagraphStyle('Code', parent=styles['Code'],
    fontName='Courier', fontSize=7.2, leading=10,
    leftIndent=0, spaceAfter=2,
    textColor=colors.HexColor('#1a1a2e'),
    backColor=colors.HexColor('#f8f9fa'))

toc_style = ParagraphStyle('TOC', parent=styles['Normal'],
    fontName='STSong-Light', fontSize=9, leftIndent=0.8*cm, spaceAfter=2)

toc_section_style = ParagraphStyle('TOCSection', parent=styles['Normal'],
    fontName='STSong-Light', fontSize=10, textColor=colors.HexColor('#1D3557'),
    spaceBefore=6, spaceAfter=2, fontWeight='bold')

story = []

# ── Cover page ──────────────────────────────────────────────────
story.append(Spacer(1, 3*cm))
story.append(Paragraph("SCA", title_style))
story.append(Paragraph("Société du Courant Alternatif", subtitle_style))
story.append(Spacer(1, 0.4*cm))
story.append(HRFlowable(width="80%", thickness=3, color=colors.HexColor('#c0201a'), hAlign='CENTER'))
story.append(Spacer(1, 0.4*cm))
story.append(Paragraph("Code Source Complet", ParagraphStyle('Big', parent=styles['Normal'],
    fontName='STSong-Light', fontSize=18, textColor=colors.HexColor('#1D3557'), alignment=TA_CENTER)))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("Électricité générale • Solutions solaires • Matériel électrique", subtitle_style))
story.append(Paragraph("Haut-Katanga, RDC", subtitle_style))
story.append(Spacer(1, 2*cm))

info_style = ParagraphStyle('Info', parent=styles['Normal'],
    fontName='STSong-Light', fontSize=10, textColor=colors.HexColor('#333333'), alignment=TA_CENTER)

# Count stats
total_files = len([f for f, _ in FILES if os.path.exists(os.path.join(APP_ROOT, f))])
total_lines = sum(
    len(open(os.path.join(APP_ROOT, f)).readlines())
    for f, _ in FILES if os.path.exists(os.path.join(APP_ROOT, f))
)
story.append(Paragraph(f"Stack : React + TypeScript + Tailwind CSS + Supabase", info_style))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(f"Fichiers inclus : {total_files}   |   Lignes de code : {total_lines:,}", info_style))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("Généré le 18 septembre 2026", info_style))
story.append(PageBreak())

# ── Table of contents ───────────────────────────────────────────
story.append(Paragraph("Table des matières", section_style))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1D3557')))
story.append(Spacer(1, 0.3*cm))

current_section = None
for rel_path, section in FILES:
    abs_path = os.path.join(APP_ROOT, rel_path)
    if not os.path.exists(abs_path):
        continue
    if section != current_section:
        current_section = section
        story.append(Paragraph(f"■  {section}", toc_section_style))
    fname = os.path.basename(rel_path)
    story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{rel_path}", toc_style))

story.append(PageBreak())

# ── Code sections ────────────────────────────────────────────────
current_section = None

for rel_path, section in FILES:
    abs_path = os.path.join(APP_ROOT, rel_path)
    if not os.path.exists(abs_path):
        continue

    # Section header
    if section != current_section:
        current_section = section
        story.append(Paragraph(f"● {section}", section_style))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#c0201a')))
        story.append(Spacer(1, 0.2*cm))

    # Read file
    with open(abs_path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    lines = content.splitlines()
    line_count = len(lines)

    # File header
    story.append(KeepTogether([
        Paragraph(f"📄 {rel_path}", filename_style),
        Paragraph(f"{line_count} lignes  |  {os.path.getsize(abs_path):,} octets", meta_style),
        HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc')),
        Spacer(1, 0.15*cm),
    ]))

    # Code content — split into chunks of 80 lines to avoid huge flowables
    CHUNK = 80
    for i in range(0, len(lines), CHUNK):
        chunk_lines = lines[i:i+CHUNK]
        # Escape XML special chars
        safe_lines = []
        for ln in chunk_lines:
            ln = ln.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            # Preserve indentation with non-breaking spaces
            stripped = ln.lstrip(' ')
            indent = len(ln) - len(stripped)
            safe_lines.append('\xa0' * indent + stripped)
        code_text = '\n'.join(safe_lines)
        story.append(Preformatted(code_text, code_style))

    story.append(Spacer(1, 0.5*cm))

# ── Build ────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF generated: {OUTPUT}")
print(f"Size: {os.path.getsize(OUTPUT):,} bytes")
