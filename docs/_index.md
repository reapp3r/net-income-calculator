# Documentation

Detailed tax documentation for the Net Income Calculator.

## Getting Started

**For Users:**

- Start with [README.md](../README.md) for installation and usage
- See [Portugal Tax Rules](pt.md) for detailed tax information
- See [UK Tax Rules](gb.md) for United Kingdom tax information
- Refer to [Common Tax Concepts](common.md) for cross-country topics

**For Developers:**

- See [CLAUDE.md](../CLAUDE.md) for implementation details and coding guidelines

## Tax Rules

| Topic              | Documentation                                                           |
| ------------------ | ----------------------------------------------------------------------- |
| Portugal Tax Rules | [pt.md](pt.md) - Complete IRS implementation                            |
| UK Tax Rules       | [gb.md](gb.md) - Income tax, NI, Scotland-specific bands, PSA, 60% trap |
| Common Concepts    | [common.md](common.md) - FTC, EU/EEA, currency handling                 |

## Quick Reference

### Residency Countries

| Country  | Implemented | Status |
| -------- | ----------- | ------ |
| Portugal | ✓           | Active |
| UK       | ✓           | Active |

### Source Countries (Withholding Tax)

| Country  | WHT Implemented |
| -------- | --------------- |
| Portugal | ✓               |
| UK       | ✓               |
| Germany  | ✓               |

## Future Architecture (Multi-Country)

> These documents describe the planned multi-country architecture. Not yet implemented.

| Document                            | Description                                           |
| ----------------------------------- | ----------------------------------------------------- |
| [Data Structure](data_structure.md) | Multi-country data organization                       |
| [File Formats](file_formats.md)     | Input file formats for future architecture            |
| [ISO Standards](standards.md)       | Validation standards (country codes, currency, dates) |

## Reading Order

**New Users:**

1. [README.md](../README.md) - Installation and quick start
2. [Portugal Tax Rules](pt.md) - Tax brackets, deductions, NHR
3. [UK Tax Rules](gb.md) - Income tax, NI, Scotland-specific bands, PSA, 60% trap
4. [Common Concepts](common.md) - Foreign tax credits, dividend rules

**Developers:**

1. [CLAUDE.md](../CLAUDE.md) - Architecture and implementation guide
2. [Common Concepts](common.md) - Cross-country calculation patterns
3. [Future Architecture](data_structure.md) - Planned multi-country design
