<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Header Section -->
      <header class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p class="text-gray-600">Monitor your services and infrastructure in real-time</p>
          </div>
          <div class="flex gap-3">
            <button 
              class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200 flex items-center gap-2"
              @click="exportCSV"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button 
              class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200 flex items-center gap-2"
              @click="openBulkImport"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Bulk Import
            </button>
            <button 
              class="px-4 py-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200 flex items-center gap-2"
              @click="openCreate"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Monitor
            </button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-lg p-6 border border-gray-200 transition-all hover:shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600">UP</span>
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="18 15 12 9 6 15" stroke-width="2"></polyline>
              </svg>
            </div>
            <div class="text-3xl font-bold text-gray-500">{{ upCount }}</div>
          </div>

          <div class="bg-white rounded-lg p-6 border border-gray-200 transition-all hover:shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600">DOWN</span>
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" stroke-width="2"></polyline>
              </svg>
            </div>
            <div class="text-3xl font-bold text-gray-500">{{ downCount }}</div>
          </div>

          <div class="bg-white rounded-lg p-6 border border-gray-200 transition-all hover:shadow-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600">PAUSED</span>
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" stroke-width="2"></rect>
                <rect x="14" y="4" width="4" height="16" stroke-width="2"></rect>
              </svg>
            </div>
            <div class="text-3xl font-bold text-gray-500">{{ pausedCount }}</div>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="store.loading" class="bg-white rounded-lg shadow-md overflow-hidden p-16 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mb-4"></div>
        <p class="text-gray-600">Loading monitors...</p>
      </div>

      <!-- Filters and View Toggle -->
      <div v-if="!store.loading" class="mb-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex gap-2 items-center flex-wrap">
            <!-- Type Filter -->
            <div class="relative">
              <button 
                @click="toggleTypeDropdown"
                class="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9" stroke-width="2"></polyline>
                </svg>
                {{ filterType || 'Type' }}
              </button>
              <div 
                v-if="showTypeDropdown" 
                class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]"
              >
                <button 
                  @click="filterType = ''; showTypeDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                >
                  All
                </button>
                <button 
                  @click="filterType = 'PING'; showTypeDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  PING
                </button>
                <button 
                  @click="filterType = 'HTTP'; showTypeDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  HTTP
                </button>
                <button 
                  @click="filterType = 'TCP'; showTypeDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  TCP
                </button>
                <button 
                  @click="filterType = 'SMB'; showTypeDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
                >
                  SMB
                </button>
              </div>
            </div>

            <!-- Status Filter -->
            <div class="relative">
              <button 
                @click="toggleStatusDropdown"
                class="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9" stroke-width="2"></polyline>
                </svg>
                {{ filterStatus ? filterStatus.toUpperCase() : 'Status' }}
              </button>
              <div 
                v-if="showStatusDropdown" 
                class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]"
              >
                <button 
                  @click="filterStatus = ''; showStatusDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                >
                  All
                </button>
                <button 
                  @click="filterStatus = 'up'; showStatusDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  UP
                </button>
                <button 
                  @click="filterStatus = 'down'; showStatusDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
                >
                  DOWN
                </button>
              </div>
            </div>

            <!-- State Filter -->
            <div class="relative">
              <button 
                @click="toggleStateDropdown"
                class="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9" stroke-width="2"></polyline>
                </svg>
                {{ filterState ? (filterState === 'active' ? 'Active' : 'Paused') : 'State' }}
              </button>
              <div 
                v-if="showStateDropdown" 
                class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]"
              >
                <button 
                  @click="filterState = ''; showStateDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                >
                  All
                </button>
                <button 
                  @click="filterState = 'active'; showStateDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Active
                </button>
                <button 
                  @click="filterState = 'paused'; showStateDropdown = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
                >
                  Paused
                </button>
              </div>
            </div>

            <button @click="clearFilters" class="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"></line>
                <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"></line>
              </svg>
              Clear
            </button>
          </div>

          <div class="flex gap-4 items-center">
            <div class="flex gap-2 items-center">
              <button 
                v-if="selectedMonitors.length > 0"
                @click="bulkDelete"
                :class="[
                  'flex items-center justify-center w-10 h-10 bg-white border rounded-lg transition-all',
                  'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50'
                ]"
                :title="`Delete ${selectedMonitors.length} monitor${selectedMonitors.length > 1 ? 's' : ''}`"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button 
                v-if="selectionMode && filteredMonitors.length > 0"
                @click="selectAllFiltered"
                :class="[
                  'flex items-center justify-center w-10 h-10 bg-white border rounded-lg transition-all',
                  allFilteredSelected 
                    ? 'bg-pink-50 border-pink-500 text-pink-600' 
                    : 'border-gray-300 text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300'
                ]"
                :title="allFilteredSelected ? 'Deselect All' : 'Select All'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path v-if="!allFilteredSelected" stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </button>
              <button 
                v-if="selectedMonitors.length > 0"
                @click="openBulkEdit"
                :class="[
                  'flex items-center justify-center w-10 h-10 bg-white border rounded-lg transition-all',
                  'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50'
                ]"
                :title="`Edit ${selectedMonitors.length} monitor${selectedMonitors.length > 1 ? 's' : ''}`"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                @click="toggleSelectionMode"
                :class="[
                  'flex items-center justify-center w-10 h-10 bg-white border rounded-lg transition-all',
                  selectionMode 
                    ? 'bg-pink-50 border-pink-500 text-pink-600' 
                    : 'border-gray-300 text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300'
                ]"
                :title="selectionMode ? 'Cancel Edit Mode' : 'Edit Mode'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <div class="flex gap-0 items-center">
                <button 
                  @click="viewMode = 'list'"
                  :class="[
                    'flex items-center justify-center w-10 h-10 bg-white border rounded-l-lg transition-all',
                    viewMode === 'list' 
                      ? 'bg-pink-50 border-pink-500 text-pink-600 z-10' 
                      : 'border-gray-300 text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300'
                  ]"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
                <button 
                  @click="viewMode = 'grid'"
                  :class="[
                    'flex items-center justify-center w-10 h-10 bg-white border rounded-r-lg -ml-px transition-all',
                    viewMode === 'grid' 
                      ? 'bg-pink-50 border-pink-500 text-pink-600 z-10' 
                      : 'border-gray-300 text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300'
                  ]"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Search Input -->
            <div class="relative flex-1">
              <input 
                v-model="searchText"
                type="text"
                placeholder="Search monitors"
                class="w-full h-10 pl-4 pr-20 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              />
              <button
                v-if="searchText"
                @click="searchText = ''"
                class="absolute right-9 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid' && filteredMonitors.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div 
          v-for="monitor in filteredMonitors" 
          :key="monitor.id"
          :class="[
            'bg-white rounded-lg border overflow-hidden transition-all cursor-pointer relative',
            selectionMode && isSelected(monitor.id) 
              ? 'border-pink-500 shadow-lg shadow-pink-200 ring-2 ring-pink-300' 
              : 'border-gray-200 hover:shadow-lg hover:border-pink-300',
            ((monitor as any).is_paused || (monitor as any).active === false) ? 'opacity-60' : ''
          ]"
          @click="handleCardClick(monitor)"
        >
          <div v-if="selectionMode && isSelected(monitor.id)" class="absolute top-2 right-2 z-10">
            <div class="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-semibold text-gray-900 truncate">{{ monitor.name }}</h3>
                  <span v-if="(monitor as any).is_paused || (monitor as any).active === false" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full uppercase flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" stroke-width="2"></rect>
                      <rect x="14" y="4" width="4" height="16" stroke-width="2"></rect>
                    </svg>
                    {{ (monitor as any).active === false ? 'Disabled' : 'Paused' }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 truncate">
                  {{ monitor.target }}<span v-if="monitor.port">:{{ monitor.port }}</span>
                </p>
              </div>
            </div>

            <!-- Sparkline Chart -->
            <div class="h-20 mb-6">
              <SmallSparkline :data="monitor.sparkline || []" />
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-3">
              <div class="flex items-center gap-2.5">
                <span class="px-4 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-full uppercase border border-gray-200">
                  {{ monitor.type.toUpperCase() }}
                </span>
                <div 
                  :class="[
                    'px-4 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 uppercase',
                    monitor.last_status === 'up' ? 'bg-green-50 text-green-600' : 
                    monitor.last_status === 'down' ? 'bg-red-50 text-red-600' : 
                    'bg-gray-100 text-gray-600'
                  ]"
                >
                  <span>
                    {{ monitor.last_status ? monitor.last_status.toUpperCase() : 'UNKNOWN' }}
                  </span>
                  <span 
                    :class="[
                      'w-1.5 h-1.5 rounded-full',
                      monitor.last_status === 'up' ? 'bg-green-500' : 
                      monitor.last_status === 'down' ? 'bg-red-500' : 'bg-gray-400'
                    ]"
                  ></span>
                </div>
              </div>

              <div v-if="!selectionMode" class="flex items-center gap-1.5" @click.stop>
                <button 
                  @click="onEdit(monitor)"
                  class="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-all"
                  title="Edit Monitor"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  @click="onDelete(monitor)"
                  class="p-1.5 text-gray-700 hover:bg-red-50 rounded transition-all"
                  title="Delete Monitor"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list' && filteredMonitors.length" class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead style="background-color: white !important;" class="border-b-2 border-[#cc1389]">
              <tr>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  <button @click="setSortBy('name')" class="flex items-center gap-2 hover:text-[#cc1389] transition-colors">
                    Hostname
                    <svg v-if="sortBy === 'name'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path v-if="sortOrder === 'asc'" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                      <path v-else d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/>
                    </svg>
                  </button>
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  <button @click="setSortBy('status')" class="flex items-center gap-2 hover:text-[#cc1389] transition-colors">
                    Status
                    <svg v-if="sortBy === 'status'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path v-if="sortOrder === 'asc'" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                      <path v-else d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/>
                    </svg>
                  </button>
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  <button @click="setSortBy('type')" class="flex items-center gap-2 hover:text-[#cc1389] transition-colors">
                    Type
                    <svg v-if="sortBy === 'type'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path v-if="sortOrder === 'asc'" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                      <path v-else d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"/>
                    </svg>
                  </button>
                </th>
                <th class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Response Time
                </th>
                <th v-if="!selectionMode" class="text-left py-3 px-6 font-medium text-[#7a0b52] text-xs uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="monitor in filteredMonitors" 
                :key="monitor.id" 
                :class="[
                  'border-b border-[#f0b8dc] transition-colors cursor-pointer',
                  selectionMode && isSelected(monitor.id) 
                    ? 'bg-pink-50 shadow-inner' 
                    : 'hover:bg-[#fae7f3]'
                ]"
                @click="handleRowClick(monitor)"
              >
                <!-- Hostname -->
                <td class="py-3 px-6">
                  <div class="flex items-center gap-3">
                    <div v-if="selectionMode" class="flex-shrink-0">
                      <div 
                        :class="[
                          'w-5 h-5 rounded flex items-center justify-center border-2 transition-all',
                          isSelected(monitor.id) 
                            ? 'bg-pink-600 border-pink-600' 
                            : 'border-gray-300 bg-white'
                        ]"
                      >
                        <svg v-if="isSelected(monitor.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div :class="((monitor as any).is_paused || (monitor as any).active === false) ? 'opacity-60' : ''">
                      <h4 class="font-medium text-gray-900">{{ monitor.name }}</h4>
                      <span class="text-sm text-gray-500 truncate">
                        {{ monitor.target }}<span v-if="monitor.port">:{{ monitor.port }}</span>
                      </span>
                    </div>
                    <span v-if="(monitor as any).is_paused || (monitor as any).active === false" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full uppercase flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" stroke-width="2"></rect>
                        <rect x="14" y="4" width="4" height="16" stroke-width="2"></rect>
                      </svg>
                      {{ (monitor as any).active === false ? 'Disabled' : 'Paused' }}
                    </span>
                  </div>
                </td>
                
                <!-- Status -->
                <td class="py-3 px-6">
                  <div class="flex items-center gap-2">
                    <span 
                      :class="[
                        'px-2.5 py-1 text-xs font-semibold rounded uppercase flex items-center gap-1.5',
                        monitor.last_status === 'up' ? 'bg-green-50 text-green-600' : 
                        monitor.last_status === 'down' ? 'bg-red-50 text-red-600' : 
                        'bg-gray-100 text-gray-600'
                      ]"
                    >
                      {{ monitor.last_status ? monitor.last_status.toUpperCase() : 'UNKNOWN' }}
                      <span 
                        :class="[
                          'w-1.5 h-1.5 rounded-full',
                          monitor.last_status === 'up' ? 'bg-green-500' : 
                          monitor.last_status === 'down' ? 'bg-red-500' : 'bg-gray-400'
                        ]"
                      ></span>
                    </span>
                  </div>
                </td>
                
                <!-- Type -->
                <td class="py-3 px-6">
                  <span class="px-4 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-full uppercase border border-gray-200">
                  {{ monitor.type.toUpperCase() }}
                </span>
                </td>
                
                <!-- Response Time Chart -->
                <td class="py-3 px-6">
                  <div class="w-32 h-10">
                    <SmallSparkline :data="monitor.sparkline || []" />
                  </div>
                </td>
                
                <!-- Actions -->
                <td v-if="!selectionMode" class="py-3 px-6" @click.stop>
                  <div class="flex items-center gap-1">
                    <button 
                      @click="onEdit(monitor)"
                      class="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-all"
                      title="Edit Monitor"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      @click="onDelete(monitor)"
                      class="p-1.5 text-gray-600 hover:bg-red-50 rounded transition-all"
                      title="Delete Monitor"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!store.loading && !filteredMonitors.length" class="bg-white rounded-xl py-20 px-8">
        <!-- No results from search/filters -->
        <div v-if="searchText || filterType || filterStatus || filterState" class="text-center max-w-md mx-auto">
          <div class="w-20 h-20 bg-pink-50 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg class="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              <line x1="10" y1="10" x2="14" y2="14" stroke-width="2"></line>
            </svg>
          </div>
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">No results found</h3>
          <p class="text-gray-500 mb-2 leading-relaxed">
            <span v-if="searchText">No monitors match "<span class="font-medium text-gray-700">{{ searchText }}</span>"</span>
            <span v-else>No monitors match your current filters</span>
          </p>
          <p class="text-sm text-gray-400 mb-8">Try adjusting your search or filters</p>
          <button 
            @click="clearFilters"
            class="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50 hover:border-pink-300 transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear Filters
          </button>
        </div>
        
        <!-- No monitors at all -->
        <div v-else class="text-center max-w-md mx-auto">
          <div class="w-20 h-20 bg-gradient-to-br from-pink-50 to-pink-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg class="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-2xl font-semibold text-gray-900 mb-3">No monitors yet</h3>
          <p class="text-gray-500 mb-8 leading-relaxed">Get started by creating your first service monitor</p>
          <button 
            @click="openCreate"
            class="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50 hover:border-pink-300 transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Monitor
          </button>
        </div>
      </div>
    </div>

    <MonitorForm v-if="showForm" :value="editing" :submitting="submitting" @close="closeForm" @submit="onSubmit" />
    <BulkImportModal v-if="showBulkImport" @close="closeBulkImport" />
    <BulkEditModal v-if="showBulkEdit" :monitorIds="selectedMonitors" @close="closeBulkEdit" @success="handleBulkEditSuccess" />
    <ConfirmModal v-if="showConfirm" :message="confirmMessage" @close="closeConfirm" @cancel="closeConfirm" @confirm="confirmDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import MonitorForm from '../components/MonitorForm.vue';
import BulkImportModal from '../components/BulkImportModal.vue';
import BulkEditModal from '../components/BulkEditModal.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import SmallSparkline from '../components/SmallSparkline.vue';
import { addToast } from '../composables/useToast';
import { useMonitorsStore, type Monitor as BaseMonitor } from '../stores/monitors';
import { useSSE } from '../composables/useSSE';
import { useAuthStore } from '../stores/auth';
import { browserNotifications } from '../utils/browserNotifications';

type UIMonitor = BaseMonitor & { sparkline?: number[] };

const store = useMonitorsStore();
const authStore = useAuthStore();
const router = useRouter();
const showForm = ref(false);
const showBulkImport = ref(false);
const showBulkEdit = ref(false);
const showConfirm = ref(false);
const confirmTarget = ref<any>(null);
const editing = ref<any>(null);
const sortBy = ref<'name' | 'status' | 'type'>('name');
const sortOrder = ref<'asc' | 'desc'>('asc');
const viewMode = ref<'grid' | 'list'>('grid');
const selectionMode = ref(false);
const selectedMonitors = ref<string[]>([]);
const submitting = ref(false);
const { setConnection, closeConnection } = useSSE();

// Track previous monitor statuses for change detection
const previousStatuses = ref<Map<string, string>>(new Map());

const confirmMessage = computed(() => `Delete monitor "${confirmTarget.value?.name || ''}"?`);

function closeConfirm() {
  showConfirm.value = false;
  confirmTarget.value = null;
}

const filterType = ref('');
const filterStatus = ref('');
const filterState = ref('');
const searchText = ref('');
const showTypeDropdown = ref(false);
const showStatusDropdown = ref(false);
const showStateDropdown = ref(false);

function toggleTypeDropdown() {
  showTypeDropdown.value = !showTypeDropdown.value;
  showStatusDropdown.value = false;
  showStateDropdown.value = false;
}

function toggleStatusDropdown() {
  showStatusDropdown.value = !showStatusDropdown.value;
  showTypeDropdown.value = false;
  showStateDropdown.value = false;
}

function toggleStateDropdown() {
  showStateDropdown.value = !showStateDropdown.value;
  showTypeDropdown.value = false;
  showStatusDropdown.value = false;
}

function closeAllDropdowns() {
  showTypeDropdown.value = false;
  showStatusDropdown.value = false;
  showStateDropdown.value = false;
}

function clearFilters() {
  filterType.value = '';
  filterStatus.value = '';
  filterState.value = '';
  searchText.value = '';
  closeAllDropdowns();
}

const sortedMonitors = computed(() => {
  const monitors = [...(store.items as unknown as UIMonitor[])];
  return monitors.sort((a, b) => {
    let aValue, bValue;
    switch (sortBy.value) {
      case 'status':
        aValue = a.last_status || 'unknown';
        bValue = b.last_status || 'unknown';
        const statusOrder = { 'up': 1, 'down': 2, 'unknown': 3 };
        aValue = statusOrder[aValue as keyof typeof statusOrder] || 3;
        bValue = statusOrder[bValue as keyof typeof statusOrder] || 3;
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'name':
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
    }
    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const filteredMonitors = computed(() => {
  let monitors = sortedMonitors.value;
  if (filterType.value) {
    monitors = monitors.filter(m => m.type.toLowerCase() === filterType.value.toLowerCase());
  }
  if (filterStatus.value) {
    monitors = monitors.filter(m => (m.last_status || '').toLowerCase() === filterStatus.value);
  }
  if (filterState.value) {
    if (filterState.value === 'active') {
      monitors = monitors.filter(m => !(m as any).is_paused && (m as any).active !== false);
    } else if (filterState.value === 'paused') {
      monitors = monitors.filter(m => (m as any).is_paused || (m as any).active === false);
    }
  }
  if (searchText.value) {
    const text = searchText.value.toLowerCase();
    monitors = monitors.filter(m =>
      m.name.toLowerCase().includes(text) ||
      (m.target && m.target.toLowerCase().includes(text))
    );
  }
  return monitors;
});

function setSortBy(column: 'name' | 'status' | 'type') {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = column;
    sortOrder.value = 'asc';
  }
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedMonitors.value = [];
  }
}

function isSelected(monitorId: string) {
  return selectedMonitors.value.includes(monitorId);
}

function toggleSelection(monitorId: string) {
  const index = selectedMonitors.value.indexOf(monitorId);
  if (index > -1) {
    selectedMonitors.value.splice(index, 1);
  } else {
    selectedMonitors.value.push(monitorId);
  }
}

const allFilteredSelected = computed(() => {
  if (filteredMonitors.value.length === 0) return false;
  return filteredMonitors.value.every(m => selectedMonitors.value.includes(m.id));
});

function selectAllFiltered() {
  const filteredIds = filteredMonitors.value.map(m => m.id);
  if (allFilteredSelected.value) {
    // Deselect all filtered monitors
    selectedMonitors.value = selectedMonitors.value.filter(id => !filteredIds.includes(id));
  } else {
    // Select all filtered monitors
    const newSelections = filteredIds.filter(id => !selectedMonitors.value.includes(id));
    selectedMonitors.value.push(...newSelections);
  }
}

function handleCardClick(monitor: any) {
  if (selectionMode.value) {
    toggleSelection(monitor.id);
  } else {
    navigateToMonitor(monitor.id);
  }
}

function handleRowClick(monitor: any) {
  if (selectionMode.value) {
    toggleSelection(monitor.id);
  } else {
    navigateToMonitor(monitor.id);
  }
}

function bulkDelete() {
  if (selectedMonitors.value.length === 0) return;
  
  const count = selectedMonitors.value.length;
  confirmTarget.value = { 
    isBulk: true, 
    count: count,
    name: `${count} monitor${count > 1 ? 's' : ''}` 
  };
  showConfirm.value = true;
}

async function confirmBulkDelete() {
  try {
    for (const monitorId of selectedMonitors.value) {
      await store.remove(monitorId);
    }
    const count = selectedMonitors.value.length;
    addToast(`Successfully deleted ${count} monitor${count > 1 ? 's' : ''}`, 'success');
    selectedMonitors.value = [];
    selectionMode.value = false;
  } catch (error: any) {
    addToast(`Failed to delete monitors: ${error?.message || error}`, 'error');
  } finally {
    showConfirm.value = false;
    confirmTarget.value = null;
  }
}

function navigateToMonitor(monitorId: string) {
  router.push(`/monitor/${monitorId}`);
}

// Computed stats
const upCount = computed(() => store.items.filter(m => m.last_status === 'up').length);
const downCount = computed(() => store.items.filter(m => m.last_status === 'down').length);
const pausedCount = computed(() => store.items.filter(m => (m as any).is_paused === true || (m as any).active === false).length);
const uptimePercent = computed(() => {
  const totalWithStatus = store.items.filter(m => m.last_status !== null && m.last_status !== undefined).length;
  if (totalWithStatus === 0) return 100;
  return Math.round((upCount.value / totalWithStatus) * 100);
});

function onEdit(m: any) {
  editing.value = m;
  showForm.value = true;
}
async function onDelete(m: any) {
  confirmTarget.value = m;
  showConfirm.value = true;
}

async function confirmDelete() {
  if (!confirmTarget.value) return;
  
  // Handle bulk delete
  if (confirmTarget.value.isBulk) {
    await confirmBulkDelete();
    return;
  }
  
  // Handle single delete
  try {
    await store.remove(confirmTarget.value.id);
    addToast(`Deleted monitor "${confirmTarget.value.name}"`, 'success');
  } catch (error: any) {
    addToast(`Failed to delete: ${error?.message || error}`, 'error');
  } finally {
    showConfirm.value = false;
    confirmTarget.value = null;
  }
}
// Removed onCheckNow - now using automatic interval-based checking

function openCreate() {
  editing.value = null;
  showForm.value = true;
}
function closeForm() {
  showForm.value = false;
}
function openBulkImport() {
  showBulkImport.value = true;
}
function closeBulkImport() {
  showBulkImport.value = false;
}

function openBulkEdit() {
  if (selectedMonitors.value.length === 0) {
    addToast('Please select monitors to edit', 'error');
    return;
  }
  showBulkEdit.value = true;
}
function closeBulkEdit() {
  showBulkEdit.value = false;
}
function handleBulkEditSuccess() {
  selectedMonitors.value = [];
  selectionMode.value = false;
}
async function exportCSV() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/monitors/export/csv', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monitors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    alert('Export failed: ' + error.message);
  }
}
// Helper function to enrich sparklines for all monitors
async function enrichSparklines() {
  for (const m of store.items) {
    try {
      const logs = await store.logs(m.id, '1h');
      (m as any).sparkline = logs.map((l: any) => l.response_time_ms || 0);
    } catch (error) {
      console.warn(`Failed to fetch sparkline for monitor ${m.id}:`, error);
      (m as any).sparkline = [];
    }
  }
}

async function onSubmit(payload: any) {
  if (submitting.value) return;
  
  submitting.value = true;
  try {
    if (editing.value?.id) {
      await store.update(editing.value.id, payload);
      addToast(`Updated monitor "${payload.name}"`, 'success');
    } else {
      await store.create(payload);
      addToast(`Created monitor "${payload.name}"`, 'success');
      // Re-enrich sparklines after creating new monitor
      await enrichSparklines();
    }
    showForm.value = false;
    editing.value = null;
  } catch (e: any) {
    addToast(`Failed: ${e.message || e}`, 'error');
  } finally {
    submitting.value = false;
  }
}

// Defined once at module scope so onMounted/onUnmounted use the SAME reference,
// otherwise removeEventListener is a no-op and the listener leaks on every mount.
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    closeAllDropdowns();
  }
};

onMounted(async () => {
  // Close dropdowns when clicking outside
  document.addEventListener('click', handleClickOutside);
  
  await store.fetchAll();
  console.log('Loaded monitors:', store.items.length);
  
  // Initialize previous statuses (so we don't notify on initial load)
  for (const m of store.items) {
    if (m.last_status) {
      previousStatuses.value.set(m.id, m.last_status);
    }
  }
  
  // Enrich with sparkline data
  await enrichSparklines();
  
  // Log sparkline data for debugging
  for (const m of store.items) {
    console.log(`Monitor ${m.name} sparkline data:`, (m as any).sparkline);
  }

  // Real-time updates via SSE
  const token = localStorage.getItem('token');
  const eventSource = new EventSource(`/api/events${token ? `?token=${encodeURIComponent(token)}` : ''}`);
  
  // Register this connection globally
  setConnection(eventSource);
  
  eventSource.onmessage = async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'monitors') {
        console.log('Received SSE update:', data.data.length, 'monitors');
        
        // Check for status changes before updating
        const notificationsEnabled = authStore.user?.browser_notifications_enabled ?? true;
        const permission = browserNotifications.getPermission();
        console.log('Notifications enabled:', notificationsEnabled, 'Permission:', permission);
        
        if (notificationsEnabled && permission === 'granted') {
          for (const newMonitor of data.data) {
            const oldStatus = previousStatuses.value.get(newMonitor.id);
            const newStatus = newMonitor.last_status;
            
            console.log(`Monitor ${newMonitor.name}: old=${oldStatus}, new=${newStatus}`);
            
            // Only notify if status changed to 'down' (not on initial load)
            if (oldStatus && oldStatus !== 'down' && newStatus === 'down') {
              console.log(`✓ Monitor ${newMonitor.name} went down, sending notification`);
              try {
                const result = await browserNotifications.showMonitorAlert(
                  newMonitor.name,
                  'DOWN',
                  newMonitor.id
                );
                console.log('Notification result:', result);
              } catch (error) {
                console.error('Failed to show notification:', error);
              }
            } else if (oldStatus === newStatus) {
              console.log(`  No change for ${newMonitor.name}`);
            } else if (!oldStatus) {
              console.log(`  First time seeing ${newMonitor.name}`);
            } else if (oldStatus === 'down' && newStatus === 'down') {
              console.log(`  ${newMonitor.name} still down`);
            } else if (newStatus === 'up') {
              console.log(`  ${newMonitor.name} is up`);
            }
          }
        } else {
          console.log('Skipping notifications - not enabled or no permission');
        }
        
        // Always update previous statuses after checking
        for (const newMonitor of data.data) {
          if (newMonitor.last_status) {
            previousStatuses.value.set(newMonitor.id, newMonitor.last_status);
          }
        }
        
        store.personal.monitors = data.data;
        
        // Re-enrich sparklines for all monitors
        for (const m of store.items) {
          try {
            const logs = await store.logs(m.id, '1h');
            (m as any).sparkline = logs.map((l: any) => l.response_time_ms || 0);
            console.log(`SSE Update - Monitor ${m.name}: status=${m.last_status}, last_check=${m.last_check}, sparkline_length=${(m as any).sparkline.length}`);
          } catch (error) {
            console.warn(`Failed to fetch sparkline for monitor ${m.id}:`, error);
            (m as any).sparkline = [];
          }
        }
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };
  
  eventSource.onerror = (error: Event) => {
    console.error('SSE connection error:', error);
  };
});

// Cleanup: Close SSE connection when component unmounts
onUnmounted(() => {
  closeConnection();
  console.log('SSE connection closed on component unmount');
  
  // Remove click handler (same reference registered in onMounted)
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style>
table thead {
  background-color: white !important;
  background-image: none !important;
}

table thead tr {
  background-color: white !important;
  background-image: none !important;
}

table thead th {
  background-color: white !important;
  background-image: none !important;
}
</style>
