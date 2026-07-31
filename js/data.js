const GROUPS=[
  {
    id:'back',name:'גב',color:'#2f8cff',soft:'#eaf3ff',increment:5,
    exercises:[
      {id:'lat_pulldown',name:'Lat Pulldown',nameHe:'משיכה עליונה'},
      {id:'seated_row',name:'Seated Row',nameHe:'חתירה בישיבה'},
      {id:'dumbbell_row',name:'Dumbbell Row',nameHe:'חתירה עם דאמבל',weightLabel:'ק"ג לכל יד'}
    ]
  },
  {
    id:'chest',name:'חזה',color:'#21a66a',soft:'#eaf8f1',increment:2.5,
    exercises:[
      {id:'chest_press_machine',name:'Chest Press Machine',nameHe:'לחיצת חזה במכונה'},
      {id:'dumbbell_chest_press',name:'Dumbbell Chest Press',nameHe:'לחיצת חזה עם דאמבלים',weightLabel:'ק"ג לכל יד'},
      {id:'pec_deck',name:'Pec Deck',nameHe:'פרפר במכונה'}
    ]
  },
  {
    id:'shoulders',name:'כתפיים',color:'#8a48c7',soft:'#f3ebfb',increment:2.5,
    exercises:[
      {id:'shoulder_press_machine',name:'Shoulder Press Machine',nameHe:'לחיצת כתפיים במכונה'},
      {id:'dumbbell_shoulder_press',name:'Dumbbell Shoulder Press',nameHe:'לחיצת כתפיים עם דאמבלים',weightLabel:'ק"ג לכל יד'},
      {id:'kettlebell_shoulder_press',name:'Kettlebell Shoulder Press',nameHe:'לחיצת כתפיים עם קטלבל',weightLabel:'ק"ג לכל יד'}
    ]
  },
  {
    id:'quads',name:'ארבע ראשי',color:'#f0ad23',soft:'#fff6df',increment:5,
    exercises:[
      {id:'leg_press',name:'Leg Press',nameHe:'לחיצת רגליים'},
      {id:'goblet_squat',name:'Goblet Squat',nameHe:'סקוואט גביע'},
      {id:'leg_extension',name:'Leg Extension',nameHe:'פשיטת ברך במכונה'}
    ]
  },
  {
    id:'posterior',name:'ירך אחורית וישבן',color:'#18a9a0',soft:'#e7f8f7',increment:5,
    exercises:[
      {id:'leg_curl',name:'Leg Curl',nameHe:'כפיפת ברך במכונה'},
      {id:'romanian_deadlift',name:'Romanian Deadlift',nameHe:'דדליפט רומני'},
      {id:'hip_thrust',name:'Hip Thrust',nameHe:'הרמת אגן'}
    ]
  },
  {
    id:'biceps',name:'יד קדמית',color:'#df3f82',soft:'#fdebf3',increment:2.5,
    exercises:[
      {id:'dumbbell_curl',name:'Dumbbell Curl',nameHe:'כפיפת מרפק עם דאמבלים',weightLabel:'ק"ג לכל יד'}
    ]
  },
  {
    id:'triceps',name:'יד אחורית',color:'#e4664e',soft:'#fff0ed',increment:2.5,
    exercises:[
      {id:'tricep_pushdown',name:'Tricep Pushdown',nameHe:'פשיטת מרפק בכבל'}
    ]
  },
  {
    id:'core',name:'ליבה',color:'#4a154b',soft:'#f2e9f2',increment:0,
    exercises:[
      {id:'plank',name:'Plank',nameHe:'פלאנק',noWeight:true,repsLabel:'שניות'},
      {id:'tabata_abs',name:'Tabata Abs',nameHe:'טאבטה בטן',noWeight:true,repsLabel:'סבבים'}
    ]
  }
];

function todayStr(){return new Date().toISOString().slice(0,10)}
function fmtDate(v){
  if(!v)return '';
  const [y,m,d]=v.split('-');return `${d}/${m}/${y}`;
}
function slug(v){return String(v).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
function groupById(id){return GROUPS.find(g=>g.id===id)}
function exerciseById(id){
  for(const g of GROUPS){
    const e=g.exercises.find(x=>x.id===id);
    if(e)return {...e,group:g};
  }
  return null;
}
function normalizeLegacyExercise(ex){
  if(ex.exerciseId)return ex;
  const all=GROUPS.flatMap(g=>g.exercises.map(e=>({...e,group:g})));
  const match=all.find(x=>x.name===ex.name);
  return {...ex,exerciseId:match?.id||slug(ex.name||''),groupId:match?.group.id||ex.category||''};
}

function muscleSvg(groupId){
  const common='fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"';
  const svgs={
    back:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M16 8c2 4 2 7 1 10-2 5-5 9-4 17m19-27c-2 4-2 7-1 10 2 5 5 9 4 17M20 10c1 3 1 6 0 9l-3 8m11-17c-1 3-1 6 0 9l3 8M19 19c3 2 7 2 10 0M17 28c4 3 10 3 14 0M24 7v27"/></svg>`,
    chest:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M14 10c3 4 6 6 10 6s7-2 10-6M13 13c-3 6-4 12-2 20m24-20c3 6 4 12 2 20M12 24c5-3 8-4 12-4s7 1 12 4M24 16v18"/></svg>`,
    shoulders:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M14 13c3 2 6 3 10 3s7-1 10-3M14 13c-4 2-7 6-8 11m28-11c4 2 7 6 8 11M15 14c1 7 0 13-2 20m20-20c-1 7 0 13 2 20M20 16v18m8-18v18"/></svg>`,
    quads:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M18 7c1 8 0 14-2 20l-2 14m16-34c-1 8 0 14 2 20l2 14M18 18c4 2 8 2 12 0M17 27c5 2 9 2 14 0M24 8v31"/></svg>`,
    posterior:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M18 7c-1 7-1 13 1 19l-3 15m14-34c1 7 1 13-1 19l3 15M19 13c3 3 7 3 10 0M19 26c3 2 7 2 10 0M24 13v25"/></svg>`,
    biceps:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M13 31c5 0 7-3 8-8 1-4 3-7 7-7 3 0 5 2 6 5m-21 10c4 6 10 8 16 5 5-2 8-7 8-13M17 18l-4 13m15-15 2-7"/></svg>`,
    triceps:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M15 16c5 0 8 3 9 8 1 5 3 8 8 8m-17-16c1 10 7 18 17 16m-4-16-3-7m7 23 4-12"/></svg>`,
    core:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M16 8c2 5 2 9 1 13-1 5-2 10 0 19m15-32c-2 5-2 9-1 13 1 5 2 10 0 19M18 16h12M18 24h12M19 32h10M24 10v28"/></svg>`
  };
  return svgs[groupId]||svgs.core;
}

function getGoal(exerciseId){
  const ex=exerciseById(exerciseId);
  const hist=getExerciseHistory(exerciseId);
  if(!hist.length){
    return {
      weight:'',
      reps:8,
      text:ex.noWeight
        ? `התחל ביעד נוח של 8 ${ex.repsLabel}.`
        : 'אין עדיין נתונים. התחל במשקל נוח ל־8 חזרות.',
      short:'התחלה: 8 חזרות',
      cls:'rec-neutral'
    };
  }

  const last=hist[0];
  const prev=hist[1];
  const lastRpe=Number(last.rpe);
  const lastReps=Number(last.reps);
  const lastWeight=Number(last.weight);

  if(lastRpe>=9){
    return {
      weight:ex.noWeight?'':lastWeight,
      reps:Math.max(1,lastReps-(ex.noWeight?5:1)),
      text:ex.noWeight
        ? 'המאמץ הקודם היה גבוה. הפחת זמן או סבבים היום.'
        : 'המאמץ הקודם היה גבוה. הפחת מעט משקל או 1–2 חזרות היום.',
      short:'יעד: להפחית עומס',
      cls:'rec-danger'
    };
  }

  const repeated=prev &&
    Number(prev.rpe)>0 && Number(prev.rpe)<=8 &&
    Number(prev.reps)===lastReps &&
    (ex.noWeight || Number(prev.weight)===lastWeight);

  if(ex.noWeight){
    if(repeated){
      const step=exerciseId==='plank'?5:1;
      return {
        weight:'',
        reps:lastReps+step,
        text:`היעד היום: ${lastReps+step} ${ex.repsLabel}.`,
        short:`יעד: ${lastReps+step} ${ex.repsLabel}`,
        cls:'rec-good'
      };
    }
    return {
      weight:'',
      reps:lastReps,
      text:`חזור היום על ${lastReps} ${ex.repsLabel}. ביצוע מוצלח נוסף יאפשר התקדמות.`,
      short:`יעד: ${lastReps} ${ex.repsLabel}`,
      cls:'rec-warn'
    };
  }

  if(lastReps<12){
    if(repeated){
      return {
        weight:lastWeight,reps:lastReps+1,
        text:`היעד היום: ${lastWeight} ${ex.weightLabel||'ק"ג'} ל־${lastReps+1} חזרות.`,
        short:`יעד: ${lastReps+1} חזרות`,
        cls:'rec-good'
      };
    }
    return {
      weight:lastWeight,reps:lastReps,
      text:`חזור היום על ${lastWeight} ${ex.weightLabel||'ק"ג'} ל־${lastReps} חזרות. ביצוע מוצלח נוסף יאפשר להעלות חזרה.`,
      short:`יעד: חזרה על ${lastReps}`,
      cls:'rec-warn'
    };
  }

  if(repeated){
    return {
      weight:lastWeight+ex.group.increment,reps:8,
      text:`היעד היום: העלה ל־${lastWeight+ex.group.increment} ${ex.weightLabel||'ק"ג'} וחזור ל־8 חזרות.`,
      short:`יעד: ${lastWeight+ex.group.increment} ק"ג × 8`,
      cls:'rec-good'
    };
  }

  return {
    weight:lastWeight,reps:12,
    text:`חזור היום על ${lastWeight} ${ex.weightLabel||'ק"ג'} ל־12 חזרות. ביצוע מוצלח נוסף יאפשר העלאת משקל.`,
    short:'יעד: חזרה על 12',
    cls:'rec-warn'
  };
}

function currentRecommendation(ex,current){
  const reps=Number(current.reps);
  const rpe=Number(current.rpe);
  const weight=Number(current.weight);
  if(!reps||!rpe)return {text:'הזן את כל נתוני האימון כדי לקבל המלצה.',cls:'rec-neutral'};

  if(rpe>=9){
    return {
      text:ex.noWeight
        ? 'המאמץ גבוה מדי. בפעם הבאה הפחת זמן או מספר סבבים.'
        : reps<8
          ? 'המאמץ גבוה מדי. בפעם הבאה הפחת משקל.'
          : 'המאמץ גבוה מדי. בפעם הבאה הפחת מעט משקל או 1–2 חזרות.',
      cls:'rec-danger'
    };
  }

  const hist=getExerciseHistory(ex.id);
  const prev=hist[0];
  const samePrevious=prev &&
    Number(prev.rpe)>0 && Number(prev.rpe)<=8 &&
    Number(prev.reps)===reps &&
    (ex.noWeight||Number(prev.weight)===weight);

  if(ex.noWeight){
    if(samePrevious){
      const step=ex.id==='plank'?5:1;
      return {text:`ביצוע מוצלח נוסף. בפעם הבאה העלה ל־${reps+step} ${ex.repsLabel}.`,cls:'rec-good'};
    }
    return {text:'ביצוע טוב. חזור פעם נוספת על אותו יעד לפני התקדמות.',cls:'rec-warn'};
  }

  if(reps<12){
    if(samePrevious){
      return {text:`בפעם הבאה העלה ל־${reps+1} חזרות באותו משקל.`,cls:'rec-good'};
    }
    return {text:'ביצוע טוב. חזור פעם נוספת על אותו משקל ומספר חזרות.',cls:'rec-warn'};
  }

  if(samePrevious){
    return {text:`בפעם הבאה העלה משקל ב־${ex.group.increment} ק"ג וחזור ל־8 חזרות.`,cls:'rec-good'};
  }
  return {text:'הגעת ל־12 חזרות. חזור פעם נוספת לפני העלאת משקל.',cls:'rec-warn'};
}
