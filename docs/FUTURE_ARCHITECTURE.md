# Future Architecture: Multi-Country Support

## Current State (MVP)

**Scope**: Portugal tax residency only  
**Structure**: Single country directory with reference data  
**Use Case**: Calculate Portugal tax for Portugal residents

```
data/portugal/
├── Income.csv              # User income
└── PT_*.csv               # Portugal tax rules
```

---

## Future: Multi-Country Scenarios

### Supported Scenarios

1. **Tax residency change mid-year** (e.g., move from Portugal to UK in July)
2. **Multiple jobs in different countries per month** (e.g., freelance projects in PT, UK, DE simultaneously)
3. **Split-year treatment** (partial year taxation in each country)
4. **Automatic residency determination** with manual override

---

## File Structure Changes

### Future Structure
```
data/
├── Income.csv              # Global income (all countries, all employers)
├── Residency.csv          # Residency tracking (optional, overrides auto-calculation)
└── references/
    ├── portugal/
    │   └── PT_*.csv       # Portugal tax rules
    └── uk/                # Future countries
        └── UK_*.csv
```

### Backward Compatibility
- **Current MVP**: `data/portugal/Income.csv` continues to work
- **Future**: `data/Income.csv` + `data/Residency.csv` for multi-country

Loader detects which structure is present and handles both.

---

## Enhanced Data Schemas

### Income.csv (Global)

**New columns**:
```csv
Year,Month,Day,GrossIncome,IncomeType,SourceCountry,EmployerCountry,WorkLocation,ProjectId,...
```

- `Day`: Day of month (for precise tracking)
- `EmployerCountry`: Where employer is based
- `WorkLocation`: Where work was performed
- `ProjectId`: Track multiple employers/projects

**Example - Multiple jobs in same month**:
```csv
Year,Month,Day,GrossIncome,IncomeType,SourceCountry,ProjectId
2025,7,5,3000,freelance,PT,ClientA
2025,7,15,2500,freelance,UK,ClientB
2025,7,25,1500,employment,DE,EmployerX
```

### Residency.csv (Manual Override)

**Schema**:
```csv
Year,Month,TaxResidencyCountry,DaysInCountry,SplitYearTreatment,Notes
```

**Example - Move from PT to UK**:
```csv
Year,Month,TaxResidencyCountry,DaysInCountry,SplitYearTreatment,Notes
2025,1,PT,31,no,
2025,2,PT,28,no,
2025,6,PT,30,split_year_start,Last month as PT resident
2025,7,UK,31,split_year_end,First month as UK resident
2025,8,UK,31,no,
```

**Purpose**: User determines tax residency (with tax advisor), calculator uses this instead of auto-calculation.

---

## Key Features

### 1. Tax Residency Determination

**Manual Override (Primary)**:
- User inputs residency in `Residency.csv`
- Calculator uses this directly

**Auto-Calculation (Future)**:
- Apply 183-day test
- Apply OECD tie-breaker rules (Article 4)
- Used only if `Residency.csv` is missing or incomplete

### 2. Split-Year Treatment

When residency changes mid-year:
1. Calculate tax for each residency period separately
2. Apply proration rules
3. Generate separate outputs per country
4. User may need dual filing

**Example**: Move PT→UK in July 2025
- Jan-Jun: Portugal resident tax
- Jul-Dec: UK resident tax

### 3. Multi-Job Aggregation

When multiple employers in same month:
1. Group income by source country
2. Calculate foreign tax for each source
3. Apply foreign tax credits in residence country
4. Aggregate results

**Handles**:
- Multiple freelance clients in different countries
- Employment + freelance simultaneously
- Remote work with international clients

---

## Implementation Phases

### Phase 1: File Structure
- Add `data/references/` support
- Maintain backward compatibility with `data/portugal/`
- Update loader to detect both structures

### Phase 2: Global Income File
- Support `data/Income.csv` with enhanced schema
- Support `data/Residency.csv` (optional)
- Keep `data/portugal/Income.csv` working (MVP)

### Phase 3: Residency Engine
- Manual override from `Residency.csv` (primary)
- Auto-calculation (183-day test, tie-breakers)
- Split-year detection

### Phase 4: Split-Year Treatment
- Period-based calculations
- Proration logic
- Multiple country outputs

### Phase 5: Multi-Job Aggregation
- Aggregate by source country
- Foreign tax credit calculations
- Monthly consolidated reports

---

## Code Extension Points

Key files where multi-country logic will be added:

**`lib/loader.js`**
- Detect file structure (MVP vs multi-country)
- Load global `Income.csv` + `Residency.csv`
- Maintain backward compatibility

**`lib/calculator.js`**
- Determine tax residency per month
- Handle split-year scenarios
- Aggregate multi-job income

**`lib/residency/base.js`**
- Add residency determination methods
- Implement 183-day test
- Implement tie-breaker rules

See code comments marked with `// FUTURE:` for specific extension points.

---

## Migration Path

### Current Users (MVP)
No changes needed. Continue using `data/portugal/Income.csv`.

### Multi-Country Users (Future)
1. Create `data/Income.csv` with all income
2. Create `data/Residency.csv` with residency tracking
3. Move reference data to `data/references/portugal/`
4. Run calculator as before

### Both Formats Supported
Loader automatically detects which structure is present.

---

## Notes

- **MVP stays unchanged**: No breaking changes to current functionality
- **Future-ready**: Architecture supports multi-country without major refactoring
- **User determines residency**: Tax residency is complex; user inputs determination result
- **Extensible**: New countries = add `data/references/countrycode/` directory

For implementation details, see code comments marked with `// FUTURE:` in relevant files.
