/* care team: "View profile" opens an accessible modal (focus trap, Esc, return focus via Tidewell.openModal) */
(function () {
  var BIOS = {
    'doc-1': ['Mei Lin leads clinical care across all three Tidewell centres. She looks after patients with complex needs on in-centre haemodialysis and chairs our monthly quality meeting, where every patient plan is reviewed.', 'MBBS, MD (Medicine), DM (Nephrology); fellowship in dialysis, Singapore'],
    'doc-2': ['Peter has run kidney clinics for over two decades. He leads the CKD clinic, helping people slow kidney disease, and guides patients and families through transplant assessment and living-donor work-up.', 'MBBS, MD (Medicine), DM (Nephrology), Chennai'],
    'doc-3': ['Arjun helps patients choose and succeed with dialysis at home. He trains alongside our home therapies nurses and visits new home patients during their first month.', 'MBBS, MD, DNB (Nephrology); home dialysis training, Melbourne'],
    'doc-4': ['Kavya leads our nocturnal programme and has a special interest in heart health for people with kidney disease. She is known for explaining results in plain, unhurried language.', 'MBBS, MD (Medicine), DM (Nephrology), Bengaluru'],
    'nurse-1': ['Anita manages the in-centre unit at Besant Nagar. She sets our safety checklists, mentors new nurses and still spends part of every shift on the floor with patients.', 'BSc Nursing; certified nephrology nurse; infection prevention lead'],
    'nurse-2': ['Daniel runs the overnight shifts in our sleep rooms. Patients say his calm voice and steady checks make it easy to drift off during a long, gentle session.', 'BSc Nursing; dialysis nursing certificate'],
    'nurse-3': ['Grace trains patients and carers for peritoneal dialysis and home haemodialysis, then stays on the end of the phone as they settle in at home.', 'BSc Nursing; home therapies and PD specialist training'],
    'nurse-4': ['Thomas checks every fistula and graft, teaches patients to look after their access and is our go-to person for gentle, confident cannulation.', 'GNM, BSc Nursing; vascular access nursing course'],
    'spec-1': ['Elena turns renal diet rules into real Indian meal plans. She runs monthly cooking demonstrations and reviews every patient’s bloods with the nephrology team.', 'MSc Clinical Nutrition; registered dietitian; renal nutrition certificate'],
    'spec-2': ['Joseph supports patients and families with the emotional and practical sides of dialysis, from low mood and worry to government schemes and work.', 'MSW (Medical and Psychiatric Social Work); counselling diploma'],
    'spec-3': ['Emmanuel creates and repairs fistulas and grafts, working closely with our access nurse so problems are spotted and treated early.', 'MBBS, MS (General Surgery), MCh (Vascular Surgery)'],
    'spec-4': ['Mai is your first call for scheduling, insurance paperwork and holiday dialysis. She arranges sessions at other centres when you travel.', 'BBA (Healthcare Management); patient navigation certificate']
  };
  var LABEL = { doctors: 'Doctor', nurses: 'Nurse', specialists: 'Specialist' };
  var team = (window.Tidewell && Tidewell.team) || window.TIDEWELL_TEAM || [];
  function $(id) { return document.getElementById(id); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-profile]');
    if (!b) return;
    var id = b.getAttribute('data-profile');
    var t = team.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var info = BIOS[id] || ['', ''];
    var img = new Image(160, 160);
    img.src = 'images/' + id + '-160.webp';
    img.alt = t.name + ', ' + t.role;
    $('pmPhoto').replaceChildren(img);
    $('pmBadge').textContent = LABEL[t.group] || '';
    $('pmName').textContent = t.name;
    $('pmRole').textContent = t.role;
    $('pmBio').textContent = info[0];
    $('pmSpec').textContent = t.specialty;
    $('pmYears').textContent = t.years + ' years';
    $('pmLangs').textContent = t.languages.join(', ');
    $('pmCentre').textContent = 'Tidewell ' + t.centre;
    $('pmEdu').textContent = info[1];
    Tidewell.openModal('profileModal', b);
  });
})();
