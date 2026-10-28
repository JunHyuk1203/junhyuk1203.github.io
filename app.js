(() => {
  const rows = [...document.querySelectorAll('[data-post]')];
  const tools = document.querySelector('#tools');
  if (tools && rows.length) {
    tools.hidden = false;
    let selected = '전체';
    const search = document.querySelector('#search');
    const buttons = [...document.querySelectorAll('[data-filter]')];
    const filter = () => {
      const query = search.value.trim().normalize('NFKC').toLocaleLowerCase('ko');
      let count = 0;
      for (const row of rows) {
        const match = (selected === '전체' || row.dataset.category === selected) && row.dataset.search.normalize('NFKC').toLocaleLowerCase('ko').includes(query);
        row.hidden = !match;
        if (match) count++;
      }
      document.querySelector('#empty').hidden = count > 0;
      document.querySelector('#result-count').textContent = `${rows.length}개 중 ${count}개의 이야기를 보고 있어요.`;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
    };
    buttons.forEach(button => button.addEventListener('click', () => {selected = button.dataset.filter; filter();}));
    search.addEventListener('input', filter);
    document.querySelector('#reset').addEventListener('click', () => {selected = '전체'; search.value = ''; filter(); search.focus();});
  }
  const share = document.querySelector('[data-share]');
  if (share && navigator.clipboard && window.isSecureContext) {
    share.hidden = false;
    share.addEventListener('click', async () => {
      const status = document.querySelector('.share-status');
      try {await navigator.clipboard.writeText(location.origin + location.pathname); status.textContent = '글 주소를 복사했어요.';}
      catch {status.textContent = '주소 표시줄에서 글 주소를 복사해 주세요.';}
    });
  }
  if (document.querySelector('.adsbygoogle')) {
    try {(window.adsbygoogle = window.adsbygoogle || []).push({});} catch { /* Ads must not interrupt reading. */ }
  }
})();
