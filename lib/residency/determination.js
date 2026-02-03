/**
 * @module determination
 * Tax Residency Determination Orchestrator
 *
 * Delegates to country-specific implementations to determine tax residency.
 * Applies OECD tie-breaker when multiple countries claim residency.
 * Does NOT contain country-specific residency test logic.
 *
 * @example
 * // Auto-determine residency for 2025
 * // const residency = new ResidencyDetermination(countries);
 * const result = residency.determineResidency(2025, data, manualOverrides);
 *
 * // Manual override for complex case
 * const taxResidency = {
 *   '2025': { country: 'PT', method: 'manual' },
 *   '2026': { country: 'GB', method: 'tie-breaker-vital-interests', dualResident: ['PT', 'GB'] }
 * };
 */

class ResidencyDetermination {
  /**
   * @param {Map} countries - Map of CountryCode → TaxResidency instance
   */
  constructor(countries) {
    this.countries = countries;
  }

  /**
   * Determine tax residency for all years in dataset
   * Auto-detects split-year from location data when person permanently relocates
   *
   * @param {Object} data - Complete dataset with location, work, accommodation, income
   * @param {Object} manualOverrides - TaxResidency.csv data (optional)
   * @returns {Map} Year → ResidencyPeriod[] or Year → ResidencyPeriod
   */
  determineResidency(data, manualOverrides) {
    const years = this.getUniqueYears(data);
    const residencyByYear = new Map();

    for (const year of years) {
      // Check manual override first
      if (manualOverrides && manualOverrides[year]) {
        residencyByYear.set(year, [manualOverrides[year]]);
        continue;
      }

      // Auto-detect split-year from location data
      const splitYear = this.detectSplitYear(year, data.location);

      if (splitYear) {
        // Process each period separately
        const periods = [];
        splitYear.forEach(() => {
          const residency = this.determineForYear(year, data);
          periods.push(residency);
        });
        residencyByYear.set(year, periods);
      } else {
        // Full year - single residency determination
        const residency = this.determineForYear(year, data);
        residencyByYear.set(year, [residency]);
      }
    }

    return residencyByYear;
  }

  /**
   * Detect split-year from location data
   * Identifies permanent relocation between countries
   *
   * @param {number} year - Target year
   * @param {Array} locationData - Location tracking data
   * @returns {Array|null} Split-year periods or null if no change detected
   */
  detectSplitYear(year, locationData) {
    const sortedLocations = (locationData || [])
      .filter((loc) => new Date(loc.Date).getFullYear() === year)
      .sort((a, b) => Date.parse(a.Date) - Date.parse(b.Date));

    // Look for permanent relocation pattern
    const relocations = [];
    let currentCountry = null;

    for (const location of sortedLocations) {
      if (location.LocationType === 'Travel' && location.FromCountry !== location.ToCountry) {
        // Potential relocation
        if (currentCountry && currentCountry !== location.ToCountry) {
          relocations.push({
            from: currentCountry,
            to: location.ToCountry,
            date: location.Date,
            previousCountry: location.FromCountry,
          });
        }
        currentCountry = location.ToCountry;
      } else if (location.LocationType === 'Residence') {
        // Current country established
        currentCountry = location.ToCountry;
      }
    }

    // Filter out single-day travels
    const filteredRelocations = relocations.filter((_reloc) => {
      // Keep all relocations for now - implement 30-day rule later if needed
      return true;
    });

    if (filteredRelocations.length === 0) {
      return null; // No permanent relocation detected
    }

    // Find the first permanent relocation
    const permanentRelocation = filteredRelocations[0];

    if (!permanentRelocation) {
      throw new Error(
        `Cannot determine split-year for ${year}. ` +
          `Expected permanent relocation but none detected in Location.csv. ` +
          `Add a relocation entry showing permanent move from ${permanentRelocation.from} to ${permanentRelocation.to} on ${permanentRelocation.date}.`
      );
    }

    // Create split-year periods
    const periods = [];
    const currentPeriod = {
      startYear: year,
      startMonth: 1,
      startDay: 1,
      country: permanentRelocation.from,
      startDate: permanentRelocation.date,
    };

    // Find when relocation happened
    let relocationDate = new Date(Date.parse(permanentRelocation.date));
    while (relocationDate.getFullYear() < year) {
      relocationDate = new Date(
        relocationDate.getFullYear() + 1,
        relocationDate.getMonth(),
        relocationDate.getDate()
      );
    }

    const relocationMonth = permanentRelocation.date.getMonth();
    const relocationDay = permanentRelocation.date.getDate();

    // First period: January 1 - relocation day in old country
    if (relocationMonth < 7) {
      currentPeriod.endMonth = 12;
      currentPeriod.endYear = year - 1;
      currentPeriod.endDay = 31;
    } else {
      currentPeriod.endMonth = relocationMonth;
      currentPeriod.endYear = year;
      currentPeriod.endDay = relocationDay;
    }

    periods.push(currentPeriod);

    // Second period: day after relocation in new country
    let secondPeriodStart = new Date(year, relocationMonth, relocationDay + 1);

    if (relocationMonth === 12) {
      secondPeriodStart = new Date(year + 1, 0, 1); // January 1 of next year
    } else {
      secondPeriodStart = new Date(year, relocationMonth, 1, relocationDay);
    }

    const secondPeriod = {
      startYear: year,
      startMonth: secondPeriodStart.getMonth() + 1,
      startDay: secondPeriodStart.getDate(),
      country: permanentRelocation.to,
      startDate: secondPeriodStart,
      endDate: new Date(year, 11, 30),
      endYear: year,
      endMonth: 10,
      endDay: 30,
    };

    periods.push(secondPeriod);

    return periods;
  }

  /**
   * Determine residency for a full year or single period
   *
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {Object} Residency period
   */
  determineForYear(year, data) {
    // Ask each country: "Is taxpayer resident in you?"
    const residentCountries = [];

    for (const [countryCode, residencyImpl] of this.countries) {
      const result = residencyImpl.testResidency(year, data);

      if (result.isResident) {
        residentCountries.push({ country: countryCode, result });
      }
    }

    // Handle results
    if (residentCountries.length === 0) {
      throw new Error(`No tax residency determined for ${year}`);
    }

    if (residentCountries.length === 1) {
      return {
        year,
        country: residentCountries[0].country,
        method: 'automatic',
        test: residentCountries[0].result.test,
      };
    }

    // Multiple residencies → OECD tie-breaker
    return this.applyOECDTieBreaker(year, residentCountries, data);
  }

  /**
   * Apply OECD Model Tax Convention Article 4 tie-breaker
   * Generic hierarchy that can be customized by countries
   *
   * @param {number} year - Tax year
   * @param {Array} residentCountries - Countries claiming residency with test results
   * @param {Object} data - Dataset for context
   * @returns {Object} Single country determination with method
   */
  applyOECDTieBreaker(year, residentCountries, data) {
    // 1. Permanent home test
    const withPermanentHome = residentCountries.filter((r) =>
      this.countries.get(r.country).hasPermanentHome(year, data)
    );

    if (withPermanentHome.length === 1) {
      return {
        year,
        country: withPermanentHome[0].country,
        method: 'tie-breaker-permanent-home',
        dualResident: residentCountries.map((r) => r.country),
      };
    }

    // 2. Center of vital interests
    const vitalInterests = residentCountries
      .map((r) => ({
        country: r.country,
        strength: this.countries.get(r.country).calculateVitalInterestsStrength(year, data),
      }))
      .sort((a, b) => b.strength - a.strength);

    if (vitalInterests[0].strength > vitalInterests[1]?.strength) {
      return {
        year,
        country: vitalInterests[0].country,
        method: 'tie-breaker-vital-interests',
        dualResident: residentCountries.map((r) => r.country),
      };
    }

    // 3. Habitual abode (most days)
    const daysByCountry = residentCountries
      .map((r) => ({
        country: r.country,
        days: this.countDaysInCountry(year, r.country, data.location),
      }))
      .sort((a, b) => b.days - a.days);

    if (daysByCountry[0].days > daysByCountry[1]?.days) {
      return {
        year,
        country: daysByCountry[0].country,
        method: 'tie-breaker-habitual-abode',
        dualResident: residentCountries.map((r) => r.country),
      };
    }

    // 4. Cannot determine - require manual intervention
    throw new Error(
      `Cannot determine single tax residency for ${year}. ` +
        `Dual resident in: ${residentCountries.map((r) => r.country).join(', ')}. ` +
        `Please specify residency manually in TaxResidency.csv.`
    );
  }

  /**
   * Count days in country - generic helper
   *
   * @param {number} year - Tax year
   * @param {string} countryCode - Country code
   * @param {Array} locationData - Location tracking data
   * @returns {number} Days present in country
   */
  countDaysInCountry(year, countryCode, locationData) {
    // Default implementation - can be overridden by country
    let days = 0;

    const countryLocations = (locationData || []).filter(
      (loc) => loc.Country === countryCode && loc.LocationType === 'Residence'
    );

    for (const location of countryLocations) {
      const locDate = new Date(location.Date);
      if (locDate.getFullYear() === year) {
        // Count days with overnight stays
        days += 1;
      }
    }

    return days;
  }

  /**
   * Get unique years from dataset
   *
   * @param {Object} data - Dataset with location, work, accommodation, income data
   * @returns {Array} Sorted list of unique years
   */
  getUniqueYears(data) {
    const years = new Set();

    // Extract years from various data sources
    if (data.location) {
      data.location.forEach((loc) => years.add(new Date(loc.Date).getFullYear()));
    }

    if (data.workActivity) {
      data.workActivity.forEach((work) => years.add(new Date(work.Date).getFullYear()));
    }

    if (data.accommodation) {
      data.accommodation.forEach((acc) => years.add(acc.Year));
    }

    if (data.income) {
      data.income.forEach((inc) => years.add(inc.Year));
    }

    if (data.incomeRecords) {
      data.incomeRecords.forEach((inc) => years.add(inc.Year || inc.year));
    }

    if (data.taxResidency) {
      Object.keys(data.taxResidency).forEach((year) => years.add(parseInt(year)));
    }

    return Array.from(years).sort((a, b) => a - b);
  }
}

module.exports = {
  ResidencyDetermination,
};
