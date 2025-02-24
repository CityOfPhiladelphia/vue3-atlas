import { ref } from 'vue';

export default function useTables() {

  const paginationOptions = (tableLength) => {
    // console.log('paginationOptions, tableLength', tableLength);
    return {
      enabled: tableLength > 5,
      mode: 'pages',
      perPage: 5,
      position: 'top',
      dropdownAllowAll: false,
      nextLabel: '',
      prevLabel: '',
      rowsPerPageLabel: '# rows',
      ofLabel: 'of',
      pageLabel: 'page', // for 'pages' mode
      allLabel: 'All',
    }
  };

  return {
    paginationOptions,
  }

}