<template>
  <div class="vgt-wrap__footer vgt-clearfix">
    <div class="footer__navigation vgt-pull-right">
      <pagination-page-info
        :total-records="total"
        :last-page="pagesCount"
        :current-page="currentPage"
        :current-per-page="currentPerPage"
        :of-text="ofText"
        :page-text="pageText"
        :info-fn="infoFn"
        :mode="mode"
        @page-changed="changePage"
      />
      <button
        type="button"
        title="previous page"
        aria-controls="vgt-table"
        class="footer__navigation__page-btn"
        :class="{ disabled: !prevIsPossible }"
        @click.prevent.stop="previousPage"
      >
        <span
          aria-hidden="true"
          class="chevron"
          :class="{ 'left': !rtl, 'right': rtl }"
        />
        <span>{{ prevText }}</span>
      </button>

      <button
        type="button"
        title="next page"
        aria-controls="vgt-table"
        class="footer__navigation__page-btn"
        :class="{ disabled: !nextIsPossible }"
        @click.prevent.stop="nextPage"
      >
        <span>{{ nextText }}</span>
        <span
          aria-hidden="true"
          class="chevron"
          :class="{ 'right': !rtl, 'left': rtl }"
        />
      </button>
    </div>
  </div>
</template>

<script type='ts'>
import VgtPaginationPageInfo from './VgtPaginationPageInfo.vue';
import {
  PAGINATION_MODES,
  DEFAULT_ROWS_PER_PAGE_DROPDOWN
} from './constants';

import { useGeocodeStore } from '@/stores/GeocodeStore';
import { useCondosStore } from '@/stores/CondosStore';

export default {
  name: 'CustomPagination',

  components: {
    'pagination-page-info': VgtPaginationPageInfo,
  },
  props: {
    styleClass: { type: String, default: 'table table-bordered' },
    total: { type: Number, default: null },
    perPage: { type: Number, default: 10 },
    rtl: { type: Boolean, default: false },
    perPageDropdownEnabled: { type: Boolean, default: true },
    customRowsPerPageDropdown: { type: Function, default() { return []; } },
    paginateDropdownAllowAll: { type: Boolean, default: true },
    mode: { type: String, default: PAGINATION_MODES.Records },
    // text options
    nextText: { type: String, default: '' },
    prevText: { type: String, default: '' },
    rowsPerPageText: { type: String, default: 'Rows per page:' },
    ofText: { type: String, default: 'of' },
    pageText: { type: String, default: 'page' },
    allText: { type: String, default: 'All' },
    infoFn: { type: Function, default: null },
    pageChanged: {
      type: Function,
      default: () => ({}),
    },
    perPageChanged: {
      type: Function,
      default: () => ({}),
    },
  },

  data() {
    return {
      id: this.getId(),
      currentPage: 1,
      prevPage: 0,
      currentPerPage: 10,
      rowsPerPageOptions: [],
    };
  },

  computed: {
    // Number of pages
    pagesCount() {
      const quotient = Math.floor(this.total / this.currentPerPage);
      const remainder = this.total % this.currentPerPage;

      return remainder === 0 ? quotient : quotient + 1;
    },

    // Can go to next page
    nextIsPossible() {
      return this.currentPage < this.pagesCount;
    },

    // Can go to previous page
    prevIsPossible() {
      return this.currentPage > 1;
    },
  },
  watch: {
    perPage: {
      handler() {
        this.handlePerPage();
      },
      immediate: true,
    },

    customRowsPerPageDropdown: {
      handler() {
        this.handlePerPage();
      },
      deep: true,
    },

    total: {
      handler(newValue) {
        if(this.rowsPerPageOptions.indexOf(this.currentPerPage) === -1) {
          this.currentPerPage = newValue;
        }
      }
    }
  },

  mounted() {
  },

  methods: {
    getId() {
      return `vgt-select-rpp-${Math.floor(Math.random() * Date.now())}`;
    },
    async getDataForPageChange(currentPage) {
      const GeocodeStore = useGeocodeStore();
      const CondosStore = useCondosStore();
      if (import.meta.env.VITE_DEBUG == 'true') console.log('getDataForPageChange, currentPage:', currentPage, '10 % 10:', 10 % 10, '((currentPage-1)/10)+1', ((currentPage-1)/10)+1, 'currentPage-1 % 10:', (currentPage-1) % 10);
      const address = GeocodeStore.aisData.features[0].properties.street_address;
      const newDataPage = Math.floor(((currentPage-1)/10)+1);
      if (import.meta.env.VITE_DEBUG == 'true') console.log('getDataForPageChange, currentPage:', currentPage, 'newDataPage:', newDataPage, 'address:', address);
      if (!CondosStore.condosData.pages['page_'+newDataPage]) {
        CondosStore.loadingCondosData = true;
        for (let i = 2; i <= newDataPage; i++) {
          if (!CondosStore.condosData.pages['page_'+i]) {
            await CondosStore.fillCondoData(address, i);
          }
        }
        CondosStore.loadingCondosData = false;
      }
    },

    // Change current page
    async changePage(pageNumber) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('CustomPagination.vue changePage, pageNumber:', pageNumber);
      if (pageNumber > 0 && this.total > this.currentPerPage * (pageNumber - 1)) {
        await this.getDataForPageChange(pageNumber);
        this.prevPage = this.currentPage;
        this.currentPage = pageNumber;
        // this.pageChanged(emit);
        this.pageChanged({currentPage: pageNumber});
      }
    },

    // Go to next page
    async nextPage() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('CustomPagination.vue nextPage, this.nextIsPossible:', this.nextIsPossible, 'this.currentPage:', this.currentPage, 'this.prevPage:', this.prevPage, 'this.total:', this.total, 'this.currentPerPage:', this.currentPerPage, 'this.pagesCount:', this.pagesCount);
      if (this.nextIsPossible) {
        this.prevPage = this.currentPage;
        ++this.currentPage;
        await this.getDataForPageChange(this.currentPage);
        this.pageChanged({currentPage: this.currentPage});
      }
    },

    // Go to previous page
    async previousPage() {
      if (this.prevIsPossible) {
        this.prevPage = this.currentPage;
        --this.currentPage;
        await this.getDataForPageChange(this.currentPage);
        this.pageChanged({currentPage: this.currentPage});
      }
    },

    // Handle per page changing
    handlePerPage() {
      //* if there's a custom dropdown then we use that
      if (this.customRowsPerPageDropdown !== null
        && (Array.isArray(this.customRowsPerPageDropdown)
        && this.customRowsPerPageDropdown.length !== 0)) {
        this.rowsPerPageOptions = JSON.parse(JSON.stringify(this.customRowsPerPageDropdown));
      } else {
        //* otherwise we use the default rows per page dropdown
        this.rowsPerPageOptions = JSON.parse(JSON.stringify(DEFAULT_ROWS_PER_PAGE_DROPDOWN));
      }

      if (this.perPage) {
        this.currentPerPage = this.perPage;
        // if perPage doesn't already exist, we add it
        let found = false;
        for (let i = 0; i < this.rowsPerPageOptions.length; i++) {
          if (this.rowsPerPageOptions[i] === this.perPage) {
            found = true;
          }
        }
        if (!found && this.perPage !== -1) {
          this.rowsPerPageOptions.unshift(this.perPage);
        }
      } else {
        // reset to default
        this.currentPerPage = 10;
      }
    },
  },
};
</script>

<style lang="scss">

</style>
