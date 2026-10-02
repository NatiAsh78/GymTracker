// Versioned prescription: legacy RPE records never drive RIR recommendations.
const PROGRAM_VERSION = '2026-10-ab';
const prescription = (code, type, group, nameHe, name, sets, min, max, increment, extra = {}) => ({
  id: `ab_${code}`, type, group, nameHe, name, sets, min, max, increment,
  weightLabel: 'ק״ג', allowZero: false, ...extra
});
const PROGRAM = [
  prescription('bench_press','A','חזה','לחיצת חזה במוט בשכיבה','Bench Press',3,8,12,2.5,{warmup:true}),
  prescription('pec_deck','A','חזה','פרפר במכונה','Pec Deck',2,10,15,2.5),
  prescription('lat_pulldown','A','גב','משיכת פולי עליון באחיזה רחבה','Wide Grip Lat Pulldown',3,8,12,2.5),
  prescription('cable_row','A','גב','חתירה ביד אחת בכבל','Unilateral Cable Row',2,10,15,2.5,{unilateral:true}),
  prescription('shoulder_press','A','כתפיים','לחיצת כתפיים בדאמבלים בישיבה במנח ביניים','Midposition Seated Dumbbell Shoulder Press',3,6,10,2.5,{weightLabel:'ק״ג לכל דאמבל'}),
  prescription('lateral_raise','A','כתפיים','הרחקת כתפיים במכונה בישיבה','Seated Machine Lateral Raise',2,10,15,2.5),
  prescription('ab_crunch','A','בטן','כפיפות בטן במכונה','Abdominal Crunch Machine',3,10,15,2.5,{allowZero:true}),
  prescription('biceps_curl','B','יד קדמית','כפיפות מרפקים עם דאמבלים בישיבה','Seated Dumbbell Biceps Curl',2,8,12,2.5,{weightLabel:'ק״ג לכל דאמבל'}),
  prescription('triceps_extension','B','יד אחורית','פשיטת מרפקים בכבל עם מוט','Cable Triceps Extension',2,8,12,2.5),
  prescription('leg_press','B','ארבע ראשי','לחיצת רגליים במנח רחב יחסית','Leg Press',3,6,10,5),
  prescription('bulgarian_split','B','ארבע ראשי','לאנג׳ בולגרי עם דאמבלים','Bulgarian Split Squat',2,8,12,2.5,{unilateral:true,weightLabel:'ק״ג לכל דאמבל'}),
  prescription('rdl','B','המסטרינג','דדליפט רומני במוט','Barbell Romanian Deadlift',3,8,12,5),
  prescription('leg_curl','B','המסטרינג','כפיפת ברכיים במכונה בישיבה','Seated Leg Curl',2,8,12,5),
  prescription('back_extension','B','גב תחתון','פשיטות גב בכיסא רומי','Roman Chair Back Extension',3,10,15,2.5,{allowZero:true,weightLabel:'ק״ג נוספים'}),
  prescription('calf_raise','B','תאומים','עליות תאומים במכונה','Machine Calf Raise',2,8,10,5)
];
const planExercises = type => PROGRAM.filter(ex => ex.type === type);
const planExercise = code => PROGRAM.find(ex => ex.id === code);
const LEGACY_LINKS = {
  ab_lat_pulldown:'lat_pulldown',ab_leg_press:'leg_press',ab_leg_curl:'leg_curl',
  ab_biceps_curl:'dumbbell_curl',ab_triceps_extension:'tricep_pushdown',
  ab_shoulder_press:'dumbbell_shoulder_press',ab_rdl:'romanian_deadlift'
};
function legacyBaseline(ex, history, date=localToday()) {
  const code=LEGACY_LINKS[ex.id];
  if(!code)return null;
  const sessions=history.filter(s=>!s.programVersion && s.date<=date).slice()
    .sort((a,b)=>b.date.localeCompare(a.date)||Number(b.id)-Number(a.id));
  for(const session of sessions){
    const entry=(session.exercises||[]).find(e=>e.exerciseId===code);
    if(entry && Number.isFinite(Number(entry.weight)) && Number(entry.weight)>0) return {...entry,date:session.date,
      sourceWeight:Number(entry.weight),sourceWeightLabel:ex.id==='ab_rdl'?'ק״ג לכל דאמבל':ex.weightLabel,
      weight:Number(entry.weight)*(ex.id==='ab_rdl'?2:1)};
  }
  return null;
}
function localToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
// Match the selected date, so backdated workouts cannot use future results.
function rirHistory(code, history, date = localToday()) {
  return history.filter(s => s.programVersion === PROGRAM_VERSION && s.date <= date)
    .slice().sort((a,b) => b.date.localeCompare(a.date) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .flatMap(s => (s.exercises || []).filter(e => e.exerciseId === code && Number.isInteger(e.rir) && e.rir >= 0)
      .map(e => ({...e,date:s.date})));
}
function nextGoal(ex, history, date) {
  const [last, previous] = rirHistory(ex.id, history, date);
  if (!last) {
    const baseline=legacyBaseline(ex,history,date);
    if(baseline)return {weight:baseline.weight,reps:Math.max(ex.min,Math.min(ex.max,Number(baseline.reps))),text:ex.id==='ab_rdl'?'נקודת פתיחה שאושרה במעבר מדאמבלים למוט: המשקל כולל את המוט. התאם ל־RIR 2; ההתקדמות מתחילה בדיווח החדש.':'נקודת פתיחה מהתרגיל התואם בתוכנית הקודמת. התאם ל־RIR 2; ההתקדמות תתחיל מדיווח RIR חדש.',kind:'neutral'};
    return {weight:null,reps:ex.min,text:`בחר משקל שמתאים ל־${ex.min} חזרות עם RIR 2 בסט האחרון.`,kind:'neutral'};
  }
  const weight = Number(last.weight), reps = Number(last.reps), rir = Number(last.rir);
  const repeatedLowReserve = rir === 1 && previous && Number(previous.rir) === 1 &&
    Number(previous.weight) === weight && Number(previous.reps) === reps;
  if ((rir === 0 || repeatedLowReserve) && reps <= ex.min) {
    const lower = Math.max(0, weight-ex.increment);
    if (weight === 0 || (!ex.allowZero && lower === 0)) return {weight,reps:ex.min,kind:'danger',text:weight===0?'אין משקל נוסף להפחית. הישאר ללא תוספת משקל ובדוק את הקושי עם המאמן.':'נדרשת הפחתת משקל. בחר עם המאמן משקל חיובי נמוך יותר שמתאים לטווח.'};
    return {weight:lower,reps:ex.min,kind:'danger',text:`הפחת ל־${lower} ${ex.weightLabel} וכוון ל־${ex.min} חזרות עם RIR 2.`};
  }
  if (reps < ex.min) return {weight,reps:ex.min,kind:'warn',text:`הביצוע מתחת לטווח. חזור על המשקל וכוון ל־${ex.min} חזרות; אם הגעת לכשל, נדרשת הפחתת משקל.`};
  if (rir === 0) return {weight,reps:Math.max(ex.min,Math.min(ex.max,reps-1)),kind:'danger',text:'הגעת לכשל. הפחת חזרה אחת באותו משקל, בתוך הטווח.'};
  if (repeatedLowReserve) return {weight,reps:Math.max(ex.min,Math.min(ex.max,reps-1)),kind:'warn',text:'שני ביצועים רצופים עם RIR 1 באותו משקל ומספר חזרות. הפחת חזרה אחת וכוון ל־RIR 2.'};
  if (rir === 1) return {weight,reps:Math.min(ex.max,reps),kind:'warn',text:'חזור על אותו משקל ומספר חזרות. יעד הקושי הוא RIR 2.'};
  const confirmed = previous && previous.reps >= ex.max && previous.rir >= 2 && Number(previous.weight) === weight;
  if (reps >= ex.max && confirmed) return {weight:weight+ex.increment,reps:ex.min,kind:'good',text:`שני אימונים רצופים בקצה הטווח עם RIR ≥ 2. העלה ב־${ex.increment} ${ex.weightLabel} וחזור ל־${ex.min} חזרות.`};
  if (reps >= ex.max) return {weight,reps:ex.max,kind:'warn',text:'הגעת לקצה הטווח. חזור עליו עם RIR ≥ 2 באימון נוסף לפני העלאת משקל.'};
  return {weight,reps:Math.min(ex.max,reps+1),kind:'good',text:'הוסף חזרה אחת באותו משקל, וכוון ל־RIR 2 בסט האחרון.'};
}
function entryError(ex, entry) {
  if (entry.weight === '' || !Number.isFinite(Number(entry.weight)) || Number(entry.weight) < 0 || (!ex.allowZero && Number(entry.weight) === 0)) return ex.allowZero?'הזן משקל של 0 ומעלה.':'הזן משקל גדול מ־0.';
  if (entry.reps === '' || !Number.isInteger(Number(entry.reps)) || Number(entry.reps) < 1) return 'הזן מספר חזרות שלם וחיובי.';
  if (entry.rir === '' || !Number.isInteger(Number(entry.rir)) || Number(entry.rir) < 0) return 'הזן RIR כמספר שלם של 0 ומעלה.';
  return '';
}
