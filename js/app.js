document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    const target=tab.dataset.tab;
    document.getElementById(`panel-${target}`).classList.add('active');
    if(target==='history')renderHistory();
  });
});

(function init(){
  const now=new Date();
  document.getElementById('headerDate').textContent=
    `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  renderWorkout();
})();
