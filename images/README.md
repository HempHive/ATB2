# Toolbar Button Images

This directory contains PNG images for the toolbar buttons. If these images are not present, the buttons will automatically fall back to using Font Awesome icons.

## Expected Image Files:

- `logo.png` - Main application logo (replaces "ATB Auto Trading Bot v3" text)
- `status-online.png` - Online status indicator (replaces "💚" emoji)
- `status-offline.png` - Offline status indicator (replaces "❌" emoji)
- `digital-account.png` - Digital Account button icon
- `digital-bank.png` - Digital Bank button icon  
- `digital-currency.png` - Digital Currency button icon
- `market-review.png` - Market Data button icon
- `strategy-editor.png` - Strategy Editor button icon
- `investment-panel.png` - Portfolio Investments button icon
- `theme-customizer.png` - GUI Customise button icon
- `theme-toggle.png` - Theme Toggle button icon

## Image Specifications:

### Logo Image (logo.png)
- **Size**: 120px height, max 360px width (3x wider than other buttons)
- **Format**: PNG with transparency
- **Style**: Should represent the ATB brand and application
- **Background**: Transparent or matching theme background
- **Orientation**: Landscape (wider than tall) - replaces logo text

### Status Images (status-online.png, status-offline.png)
- **Size**: 24px height, auto width (compact status indicator)
- **Format**: PNG with transparency
- **Style**: Should clearly indicate online/offline state
- **Background**: Transparent or matching theme background
- **Orientation**: Square or landscape - replaces emoji status

### Button Images
- **Size**: Portrait orientation (recommended: 120-160px height, 80-120px width)
- **Format**: PNG with transparency
- **Style**: Should match the overall theme aesthetic
- **Background**: Transparent or matching button background
- **Orientation**: Portrait (taller than wide) - images will completely replace buttons

## Fallback Behavior:

If any PNG image fails to load, the corresponding Font Awesome icon will automatically be displayed instead. This ensures the interface remains functional even without custom images.
