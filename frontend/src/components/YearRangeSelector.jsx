import React, { useState, useEffect } from 'react';
import { useTimezoneConfig } from '../contexts/TimezoneContext';

const YearRangeSelector = ({ subjectId }) => {
  const { AVAILABLE_YEARS, getYearRange, updateYearRange } = useTimezoneConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState(() => getYearRange(subjectId));

  // Update local state when subject changes
  useEffect(() => {
    setRange(getYearRange(subjectId));
  }, [subjectId, getYearRange]);

  const handleStartYearChange = (e) => {
    const newStartYear = parseInt(e.target.value, 10);
    if (newStartYear > range.endYear) {
      setRange(prev => ({ ...prev, startYear: newStartYear, endYear: newStartYear }));
    } else {
      setRange(prev => ({ ...prev, startYear: newStartYear }));
    }
  };

  const handleEndYearChange = (e) => {
    const newEndYear = parseInt(e.target.value, 10);
    if (newEndYear < range.startYear) {
      setRange(prev => ({ ...prev, startYear: newEndYear, endYear: newEndYear }));
    } else {
      setRange(prev => ({ ...prev, endYear: newEndYear }));
    }
  };

  const handleApply = () => {
    updateYearRange(subjectId, range.startYear, range.endYear);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-4">
      <button
        onClick={toggleOpen}
        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
      >
        <svg
          className="h-4 w-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Year Range: {range.startYear} - {range.endYear} {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startYear"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Start Year
              </label>
              <select
                id="startYear"
                value={range.startYear}
                onChange={handleStartYearChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              >
                {AVAILABLE_YEARS.map((year) => (
                  <option key={`start-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="endYear"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                End Year
              </label>
              <select
                id="endYear"
                value={range.endYear}
                onChange={handleEndYearChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
              >
                {AVAILABLE_YEARS.map((year) => (
                  <option key={`end-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleApply}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearRangeSelector;