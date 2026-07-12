import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Calendar, FileText, Video, Stethoscope, Clock, 
  Search, User, FileBarChart, Share2, Download, CreditCard, UploadCloud, 
  Star, Settings, Users, Building, Link, Lock, Phone, QrCode, 
  Brain, Activity, Smartphone, Zap 
} from 'lucide-react';

// --- INLINE ANIMATION STYLES ---
const animationStyles = `
  @keyframes slideUpFade {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes scan {
    0% { top: 0%; }
    100% { top: 100%; }
  }
  .animate-slide-up {
    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .delay-100 { animation-delay: 100ms; opacity: 0; }
  .delay-200 { animation-delay: 200ms; opacity: 0; }
  .delay-300 { animation-delay: 300ms; opacity: 0; }
`;

// Callout Badge Component
const Badge = ({ num }) => (
  <div className="absolute -top-3 -left-3 w-7 h-7 bg-teal-600 text-white font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white z-10 text-sm">
    {num}
  </div>
);

// Unified Slide Wrapper handling both 'intro' (full screen) and 'demo' (split screen)
const SlideWrapper = ({ children, slide, onNext, onPrev, step, totalSteps }) => {
  const isIntro = slide.type === 'intro';

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 font-sans overflow-hidden relative">
      <style>{animationStyles}</style>
      
      {/* Background decoration for intro slides */}
      {isIntro && (
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
           <div className="w-[800px] h-[800px] bg-teal-600 rounded-full blur-[150px]"></div>
        </div>
      )}

      {isIntro ? (
        // Full Screen Intro Layout (Light Theme)
        <div key={`intro-${step}`} className="w-full flex flex-col justify-center items-center p-12 relative z-10 text-center max-w-5xl mx-auto">
          
          {/* RENDER VISUAL IF AVAILABLE */}
          {slide.visual && (
            <div className="mb-14 animate-slide-up">
              {slide.visual}
            </div>
          )}

          <div className="absolute top-10 left-10 text-teal-700 font-bold tracking-widest uppercase text-xs bg-teal-50 px-3 py-1 rounded-full animate-slide-up">
            The CURO Story
          </div>
          <h1 className="text-5xl font-bold mb-8 text-stone-900 leading-tight animate-slide-up delay-100">{slide.title}</h1>
          <div className="text-2xl text-stone-600 leading-relaxed space-y-6 animate-slide-up delay-200 max-w-4xl mx-auto">
            {slide.content}
          </div>
        </div>
      ) : (
        // Split Screen Demo Layout (Light Theme)
        <>
          {/* Left Side: Explanations & Feature Callouts */}
          <div className="w-[40%] p-10 flex flex-col justify-center border-r border-stone-200 relative bg-white overflow-y-auto z-10">
            <div className="absolute top-10 left-10 text-teal-700 font-bold tracking-widest uppercase text-xs bg-teal-50 px-3 py-1 rounded-full">
              CURO Product Tour
            </div>
            
            {/* The key prop ensures the animations re-trigger on slide change */}
            <div key={`desc-${step}`} className="my-auto mt-20">
              <h1 className="text-3xl font-bold mb-8 text-stone-900 leading-tight animate-slide-up">{slide.title}</h1>
              
              <div className="space-y-6">
                {slide.features.map((feature, idx) => (
                  <div key={idx} className={`flex items-start bg-stone-50 p-4 rounded-xl border border-stone-200 animate-slide-up delay-${(idx + 1) * 100}`}>
                    <div className="w-8 h-8 shrink-0 bg-teal-600 text-white font-bold rounded-full flex items-center justify-center shadow-sm mr-4 mt-1">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-lg mb-1">{feature.title}</h3>
                      <p className="text-stone-600 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Side: Interactive Demo */}
          <div className="w-[60%] bg-stone-100 flex items-center justify-center p-8 relative z-10">
            <div className={`w-full ${slide.isMobileLayout ? 'max-w-sm h-[75vh] min-h-[600px] max-h-[800px]' : 'max-w-5xl h-[80vh]'} bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200 relative text-gray-900 flex flex-col transition-all duration-700 ease-in-out`}>
              {/* Fade transition for the inner component */}
              <div key={`demo-${step}`} className="h-full flex flex-col animate-slide-up delay-100">
                {children}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation Controls (Always visible at bottom) */}
      <div className={`absolute bottom-0 left-0 right-0 p-8 flex justify-between items-center z-20 ${isIntro ? '' : 'w-[40%] border-t border-stone-200 bg-white'}`}>
        <button 
          onClick={onPrev}
          disabled={step === 0}
          className="flex items-center px-4 py-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </button>
        <div className="flex flex-col items-center">
          <span className="text-stone-500 font-mono text-sm">{step + 1} / {totalSteps}</span>
          <span className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">Use Arrow Keys</span>
        </div>
        <button 
          onClick={onNext}
          disabled={step === totalSteps - 1}
          className="flex items-center px-4 py-2 rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
};

// --- DOCTOR COMPONENTS (Desktop Layout) ---

const SlideDoctorSetup = () => (
  <div className="flex h-full flex-col">
    <div className="border-b border-stone-200 p-4 flex justify-between items-center px-6 shrink-0 bg-stone-50">
      <div className="font-semibold text-lg flex items-center"><Settings className="w-5 h-5 mr-2 text-teal-700"/> Clinic Settings</div>
    </div>
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="relative">
          <Badge num="1" />
          <h3 className="font-semibold text-gray-900 mb-4 text-lg border-b border-stone-100 pb-2">Payment Integration</h3>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white rounded-lg border border-stone-200 flex items-center justify-center mr-4 shadow-sm">
                <Building className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Bank Account Linked</h4>
                <p className="text-sm text-gray-500">Payments will be routed instantly via Razorpay.</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium bg-white hover:bg-stone-50">Manage</button>
          </div>
        </div>

        <div className="relative mt-8">
          <Badge num="2" />
          <h3 className="font-semibold text-gray-900 mb-4 text-lg border-b border-stone-100 pb-2">Consultation Types</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm flex flex-col items-start">
              <div className="bg-teal-50 text-teal-700 p-2 rounded-lg mb-3">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="font-semibold mb-1">Online Video Consult</h4>
              <p className="text-sm text-gray-500 mb-4">15 mins • Automatic Google Meet link</p>
              <div className="mt-auto w-full flex justify-between items-center border-t border-stone-100 pt-3">
                <span className="font-medium text-gray-900">₹600</span>
                <div className="w-10 h-6 bg-teal-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="border border-stone-200 rounded-xl p-5 bg-white shadow-sm flex flex-col items-start">
              <div className="bg-amber-50 text-amber-700 p-2 rounded-lg mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="font-semibold mb-1">In-Clinic Visit</h4>
              <p className="text-sm text-gray-500 mb-4">20 mins • Sector 14 Clinic</p>
              <div className="mt-auto w-full flex justify-between items-center border-t border-stone-100 pt-3">
                <span className="font-medium text-gray-900">₹800</span>
                <div className="w-10 h-6 bg-teal-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8">
          <Badge num="3" />
          <h3 className="font-semibold text-gray-900 mb-4 text-lg border-b border-stone-100 pb-2">Working Hours</h3>
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm divide-y divide-stone-100">
            {['Monday', 'Tuesday', 'Wednesday'].map((day) => (
              <div key={day} className="flex justify-between items-center p-4">
                <span className="font-medium w-32">{day}</span>
                <div className="flex space-x-2">
                  <input type="text" defaultValue="09:00 AM" className="w-24 p-2 text-sm border border-stone-200 rounded bg-stone-50 text-center" />
                  <span className="text-gray-400 self-center">-</span>
                  <input type="text" defaultValue="05:00 PM" className="w-24 p-2 text-sm border border-stone-200 rounded bg-stone-50 text-center" />
                </div>
                <div className="w-10 h-6 bg-teal-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  </div>
);

const SlideDashboard = () => (
  <div className="flex h-full flex-col">
    <div className="border-b border-stone-200 p-4 flex justify-between items-center px-6 shrink-0 bg-stone-50">
      <div className="font-semibold text-lg flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-teal-700"/> Dr. Arun Sharma</div>
    </div>
    <div className="flex-1 bg-white p-6 overflow-y-auto">
      
      <div className="relative inline-block mb-8 mt-2">
        <Badge num="1" />
        <div className="bg-stone-50 px-6 py-3 rounded-xl shadow-sm border border-stone-200 inline-flex space-x-6 text-sm font-medium">
          <div>14 Appointments Today</div>
          <div className="text-stone-300">|</div>
          <div>₹8,400 Collected</div>
          <div className="text-stone-300">|</div>
          <div className="text-amber-600">2 Pending Payments</div>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">Next Patient</h3>
      <div className="relative mb-8">
        <Badge num="2" />
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center font-bold text-lg mr-4">RK</div>
              <div>
                <div className="font-semibold text-lg">Rohan Kumar</div>
                <div className="text-gray-500 text-sm">34 yrs • M • Online Consult • 10:30 AM</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium">Start Consult</button>
          </div>
          
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 text-sm">
            <div className="font-semibold mb-1 text-gray-700">Chief Complaint:</div>
            <p className="text-gray-600 mb-3">Recurring fever since 3 days.</p>
            <div className="font-semibold mb-1 text-teal-700 flex items-center">✨ AI Pre-Consult Brief:</div>
            <p className="text-teal-900">Patient presents with recurring fever. History of similar symptoms in Apr 2025. Previously prescribed Paracetamol.</p>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <Badge num="3" />
        <h3 className="font-semibold text-gray-800 mb-4 text-lg">Today's Schedule</h3>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          {[
            {time: '09:00 AM', name: 'Priya Singh', status: 'Completed', type: 'In-person'},
            {time: '09:30 AM', name: 'Amit Patel', status: 'Completed', type: 'Online'},
            {time: '10:30 AM', name: 'Rohan Kumar', status: 'Next', type: 'Online'}
          ].map((apt, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50">
              <div className="flex items-center w-1/5">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <span className="font-medium text-gray-700">{apt.time}</span>
              </div>
              <div className="w-1/3 font-medium">{apt.name}</div>
              <div className="w-1/5 text-sm text-gray-500">{apt.type}</div>
              <div className="w-1/4">
                <span className={`px-2 py-1 rounded text-xs font-medium 
                  ${apt.status === 'Completed' ? 'text-green-700 bg-green-50' : 
                    apt.status === 'Next' ? 'text-teal-700 bg-teal-50' : 
                    'text-amber-700 bg-amber-50'}`}>{apt.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SlideDoctorDatabase = () => (
  <div className="flex h-full flex-col">
    <div className="border-b border-stone-200 p-4 flex justify-between items-center px-6 shrink-0 bg-stone-50">
      <div className="font-semibold text-lg flex items-center"><Users className="w-5 h-5 mr-2 text-teal-700"/> Patient Database</div>
    </div>
    <div className="flex-1 bg-white p-8 overflow-y-auto">
      
      <div className="relative mb-6">
        <Badge num="1" />
        <div className="flex w-full bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:ring-2 ring-teal-500 ring-offset-1">
          <div className="pl-4 flex items-center justify-center">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input type="text" placeholder="Search by name, phone, or condition..." className="flex-1 p-4 bg-transparent outline-none" />
        </div>
      </div>

      <div className="relative">
        <Badge num="2" />
        <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-gray-600">
              <tr>
                <th className="p-4 font-medium">Patient Name</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Last Visit</th>
                <th className="p-4 font-medium">Total Visits</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100">
              {[
                { name: 'Rohan Kumar', phone: '+91 98765 43210', last: 'Today', total: 4 },
                { name: 'Priya Singh', phone: '+91 87654 32109', last: '2 weeks ago', total: 1 },
                { name: 'Amit Patel', phone: '+91 76543 21098', last: '1 month ago', total: 12 }
              ].map((p, i) => (
                <tr key={i} className="hover:bg-stone-50 cursor-pointer transition">
                  <td className="p-4 font-medium text-gray-900">{p.name}</td>
                  <td className="p-4 text-gray-600 font-mono text-xs">{p.phone}</td>
                  <td className="p-4 text-gray-600">{p.last}</td>
                  <td className="p-4 text-gray-600">{p.total}</td>
                  <td className="p-4 text-right">
                    <button className="text-teal-700 font-medium hover:underline text-xs bg-teal-50 px-3 py-1 rounded-md">View Record</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const SlideConsultation = () => (
  <div className="flex h-full bg-white">
    <div className="w-1/3 border-r border-stone-200 bg-stone-50 p-6 flex flex-col relative">
      <Badge num="1" />
      <div className="mb-6">
        <h2 className="text-xl font-bold">Rohan Kumar</h2>
        <div className="text-gray-500 text-sm">34 yrs • Male • O+</div>
      </div>
      
      <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Patient Timeline</h3>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        <div className="relative pl-4 border-l-2 border-stone-200">
          <div className="absolute w-3 h-3 bg-stone-300 rounded-full -left-[7px] top-1"></div>
          <div className="text-xs text-gray-500 mb-1">Today</div>
          <div className="bg-white p-3 border border-stone-200 rounded-lg shadow-sm text-sm">
            <div className="font-medium">Current Intake</div>
            <div className="text-gray-600 mt-1">Fever for 3 days.</div>
          </div>
        </div>
        <div className="relative pl-4 border-l-2 border-stone-200">
          <div className="absolute w-3 h-3 bg-stone-300 rounded-full -left-[7px] top-1"></div>
          <div className="text-xs text-gray-500 mb-1">12 Apr 2025</div>
          <div className="bg-white p-3 border border-stone-200 rounded-lg shadow-sm text-sm">
            <div className="font-medium flex items-center"><FileText className="w-3 h-3 mr-1"/> Prescription</div>
            <div className="text-gray-600 mt-1">Viral Pyrexia. Paracetamol 500mg.</div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="w-2/3 p-6 flex flex-col">
      <div className="relative mb-6">
        <Badge num="2" />
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-teal-900 flex items-center">✨ AI Pre-Consult Summary</h3>
          </div>
          <p className="text-sm text-teal-800 leading-relaxed">
            Patient presents with recurring fever for 3 days. 
            History of similar symptoms in Apr 2025, previously diagnosed as viral pyrexia.
          </p>
        </div>
      </div>
      
      <div className="relative flex-1 flex flex-col mb-4">
        <Badge num="3" />
        <h3 className="font-semibold text-gray-800 mb-2">Consultation Notes</h3>
        <textarea 
          className="flex-1 w-full border border-stone-200 rounded-xl p-4 outline-none resize-none bg-white shadow-inner"
          placeholder="Type clinical notes here..."
        ></textarea>
      </div>
      
      <div className="flex justify-between">
        <button className="px-5 py-2 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 flex items-center">
          <Video className="w-4 h-4 mr-2"/> Join Video Call
        </button>
        <button className="px-5 py-2 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800">
          Build Prescription
        </button>
      </div>
    </div>
  </div>
);

const SlidePrescription = () => (
  <div className="flex h-full flex-col bg-white">
    <div className="border-b border-stone-200 p-4 bg-stone-50 flex justify-between items-center px-6 shrink-0">
      <div className="font-semibold text-lg">Write Prescription: Rohan Kumar</div>
    </div>
    
    <div className="p-8 flex-1 overflow-y-auto w-full">
      <div className="relative mb-6">
        <Badge num="1" />
        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
        <input type="text" defaultValue="Viral fever - acute" className="w-full px-4 py-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      
      <div className="relative mb-8">
        <Badge num="2" />
        <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
        <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-gray-600">
              <tr>
                <th className="p-3 font-medium">Drug Name</th>
                <th className="p-3 font-medium">Dose</th>
                <th className="p-3 font-medium">Frequency</th>
                <th className="p-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="border-b border-stone-100">
                <td className="p-3"><input type="text" defaultValue="Paracetamol 500mg" className="w-full bg-transparent font-medium outline-none focus:text-teal-700"/></td>
                <td className="p-3"><input type="text" defaultValue="1 tab" className="w-full bg-transparent outline-none"/></td>
                <td className="p-3"><input type="text" defaultValue="1-0-1" className="w-full bg-transparent outline-none"/></td>
                <td className="p-3"><input type="text" defaultValue="5 days" className="w-full bg-transparent outline-none"/></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div className="relative p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
      <Badge num="3" />
      <button className="px-6 py-2 bg-teal-700 text-white rounded-lg font-medium flex items-center hover:bg-teal-800">
        Sign & Send via WhatsApp
      </button>
    </div>
  </div>
);

// --- PATIENT COMPONENTS (Mobile Layout) ---

const SlidePatientEntry = () => (
  <div className="h-full flex flex-col items-center justify-center bg-stone-900 relative overflow-hidden">
    {/* Camera viewfinder aesthetic */}
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_transparent_30%,_black_100%)] z-10 pointer-events-none"></div>
    
    <div className="relative z-20 flex flex-col items-center">
      <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative mb-10 flex items-center justify-center overflow-hidden">
        {/* Corner markers */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-xl -mt-0.5 -ml-0.5"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-xl -mt-0.5 -mr-0.5"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-xl -mb-0.5 -ml-0.5"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-xl -mb-0.5 -mr-0.5"></div>
        
        {/* Fake QR Code */}
        <QrCode className="w-32 h-32 text-white opacity-90" />
        
        {/* Scanning line animation */}
        <div className="absolute top-0 w-full h-[2px] bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,1)] animate-[scan_2.5s_ease-in-out_infinite_alternate]"></div>
      </div>
      
      <div className="relative">
        <Badge num="1" />
        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full flex items-center border border-white/20 shadow-lg">
          <Link className="w-4 h-4 text-teal-400 mr-2" />
          <span className="text-white font-medium tracking-wide">curo.me/dr-arun</span>
        </div>
      </div>
      
      <p className="text-white/60 text-sm mt-8 text-center max-w-[250px] leading-relaxed">
        Scan the QR code at the clinic desk or click the link in the doctor's Instagram bio.
      </p>
    </div>
  </div>
);

const SlideDoctorDirectory = () => (
  <div className="h-full flex flex-col bg-stone-50 overflow-y-auto">
    <div className="bg-white p-6 pb-4 shadow-sm border-b border-stone-200 z-10 sticky top-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Location</p>
          <p className="font-semibold text-gray-900 flex items-center text-sm">Sector 14, Gurugram <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-teal-700"/></p>
        </div>
        <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center text-teal-700 border border-teal-100">
          <User className="w-4 h-4" />
        </div>
      </div>
      
      <div className="relative mb-2">
        <Badge num="2" />
        <div className="flex shadow-sm rounded-xl overflow-hidden border border-stone-200 focus-within:ring-2 focus-within:ring-teal-500 bg-stone-50">
          <div className="pl-4 flex items-center justify-center">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input type="text" placeholder="Search doctors, specialties..." className="w-full p-3 outline-none text-sm bg-transparent" />
        </div>
      </div>
    </div>
    
    <div className="p-6 pt-4">
      <h3 className="font-bold text-gray-900 mb-4 text-sm">Top Specialties</h3>
      <div className="flex space-x-4 overflow-x-auto pb-4 mb-2 -mx-2 px-2">
        {[
          { name: 'General', icon: '🩺', color: 'bg-blue-50' },
          { name: 'Pediatrics', icon: '👶', color: 'bg-amber-50' },
          { name: 'Cardiology', icon: '❤️', color: 'bg-rose-50' },
          { name: 'Skin', icon: '✨', color: 'bg-purple-50' },
        ].map(cat => (
          <div key={cat.name} className="flex flex-col items-center shrink-0">
            <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-2xl mb-2 shadow-sm border border-black/5`}>
              {cat.icon}
            </div>
            <span className="text-[10px] font-semibold text-gray-600">{cat.name}</span>
          </div>
        ))}
      </div>
      
      <div className="relative mt-2">
        <h3 className="font-bold text-gray-900 mb-4 text-sm">Available Near You</h3>
        <div className="space-y-4">
          {[
            { name: 'Dr. Arun Sharma', spec: 'General Physician • 12 yrs exp', rating: '4.9', slots: 'Available Today', fee: '₹600' },
            { name: 'Dr. Neha Gupta', spec: 'Pediatrician • 8 yrs exp', rating: '4.8', slots: 'Next slot at 2 PM', fee: '₹800' },
          ].map((doc, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col cursor-pointer hover:border-teal-400 transition-colors">
              <div className="flex mb-3">
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-700 font-bold mr-3 border border-teal-100">
                  {doc.name.split(' ')[1][0]}{doc.name.split(' ')[2] ? doc.name.split(' ')[2][0] : ''}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-sm">{doc.name}</h4>
                    <div className="flex items-center text-[10px] font-bold text-gray-700 bg-stone-100 px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3 text-amber-500 mr-0.5 fill-amber-500" /> {doc.rating}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{doc.spec}</p>
                </div>
              </div>
              
              <div className="bg-stone-50 rounded-lg p-2.5 flex justify-between items-center border border-stone-100">
                <div className="text-[11px] font-semibold text-teal-700 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> {doc.slots}
                </div>
                <div className="text-xs font-bold text-gray-900">{doc.fee}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SlidePatientSlot = () => (
  <div className="h-full flex flex-col p-6 overflow-y-auto bg-white">
    <div className="flex space-x-2 mb-6 shrink-0 mt-2">
      <div className="h-1 flex-1 bg-teal-700 rounded-full"></div>
      <div className="h-1 flex-1 bg-stone-200 rounded-full"></div>
      <div className="h-1 flex-1 bg-stone-200 rounded-full"></div>
      <div className="h-1 flex-1 bg-stone-200 rounded-full"></div>
    </div>
    
    <div className="relative shrink-0">
      <Badge num="1" />
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Slot</h2>
      
      <div className="flex space-x-3 mb-4 overflow-x-auto pb-2 shrink-0">
        <div className="min-w-16 text-center p-2 rounded-lg border-2 border-teal-700 bg-teal-50 text-teal-900 cursor-pointer">
          <div className="text-xs font-medium">Today</div>
          <div className="text-lg font-bold">09</div>
        </div>
        <div className="min-w-16 text-center p-2 rounded-lg border border-stone-200 text-gray-500 cursor-pointer">
          <div className="text-xs font-medium">Tomorrow</div>
          <div className="text-lg font-bold">10</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="p-3 border border-stone-200 rounded-lg text-center text-gray-400 bg-stone-50 line-through text-sm">09:00 AM</div>
        <div className="p-3 border border-stone-200 rounded-lg text-center text-gray-400 bg-stone-50 line-through text-sm">09:30 AM</div>
        <div className="p-3 border-2 border-teal-700 bg-teal-700 text-white font-medium rounded-lg text-center text-sm shadow-sm">10:30 AM</div>
        <div className="p-3 border border-stone-300 rounded-lg text-center text-gray-700 font-medium text-sm">11:00 AM</div>
      </div>
    </div>
    
    <div className="mt-auto pt-4 shrink-0">
      <button className="w-full bg-teal-700 text-white font-medium py-4 rounded-xl shadow-sm text-lg hover:bg-teal-800">
        Continue
      </button>
    </div>
  </div>
);

const SlidePatientLogin = () => (
  <div className="h-full flex flex-col p-8 overflow-y-auto bg-white justify-center relative">
    <div className="flex space-x-2 absolute top-8 left-6 right-6 shrink-0 mt-2">
      <div className="h-1 flex-1 bg-teal-700 rounded-full"></div>
      <div className="h-1 flex-1 bg-teal-700 rounded-full"></div>
      <div className="h-1 flex-1 bg-stone-200 rounded-full"></div>
      <div className="h-1 flex-1 bg-stone-200 rounded-full"></div>
    </div>

    <div className="text-center mb-10 mt-12">
      <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Stethoscope className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dr. Arun Sharma</h2>
      <p className="text-gray-500">Log in to confirm booking</p>
    </div>
    
    <div className="relative shrink-0 mb-6">
      <Badge num="1" />
      <label className="block text-sm font-medium text-gray-700 mb-2">Enter Mobile Number</label>
      <div className="flex shadow-sm rounded-xl overflow-hidden border border-stone-300 focus-within:ring-2 focus-within:ring-teal-500">
        <div className="px-4 py-4 bg-stone-50 border-r border-stone-300 flex items-center text-gray-500 font-medium">
          +91
        </div>
        <input type="tel" placeholder="98765 43210" className="w-full p-4 outline-none font-medium text-lg" />
      </div>
    </div>

    <div className="relative shrink-0 mt-4 text-center">
      <Badge num="2" />
      <button className="w-full bg-teal-700 text-white font-medium py-4 rounded-xl text-lg hover:bg-teal-800 transition shadow-sm">
        Send OTP
      </button>
      <div className="flex items-center justify-center text-xs text-gray-400 mt-6">
        <Lock className="w-3 h-3 mr-1" /> Secure login. No passwords required.
      </div>
    </div>
  </div>
);

const SlidePatientComplaint = () => (
  <div className="h-full flex flex-col p-6 overflow-y-auto bg-white">
    <div className="flex space-x-2 mb-6 shrink-0 mt-2">
      <div className="h-1 flex-1 bg-teal-700 rounded-full"></div>
      <div className="h-1 flex-1 bg-teal-700 rounded-full"></div>
      <div className="h-1 flex-1 bg-teal-700 rounded-full"></div>
      <div className="h-1 flex-1 bg-stone-200 rounded-full"></div>
    </div>
    
    <div className="relative mb-6 shrink-0">
      <Badge num="1" />
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Reason for visit</h2>
      <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
      <input type="text" defaultValue="Recurring fever" className="w-full border border-stone-300 rounded-lg p-3 text-sm mb-3 bg-stone-50" />
      
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <div className="flex">
            <input type="number" defaultValue="3" className="w-16 border border-stone-300 rounded-l-lg p-3 text-sm border-r-0 focus:outline-none focus:border-teal-500" />
            <select className="flex-1 border border-stone-300 rounded-r-lg p-3 text-sm bg-stone-50 focus:outline-none focus:border-teal-500">
              <option>Days</option>
              <option>Weeks</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="border border-dashed border-stone-300 rounded-lg p-4 flex flex-col items-center justify-center bg-stone-50">
        <UploadCloud className="w-5 h-5 text-gray-400 mb-2" />
        <span className="text-sm font-medium text-teal-700">Upload past reports (Optional)</span>
      </div>
    </div>

    <div className="relative mt-auto pt-4 shrink-0">
      <Badge num="2" />
      <button className="w-full bg-gray-900 text-white font-medium py-4 rounded-xl shadow-sm text-lg hover:bg-black flex items-center justify-center">
        <CreditCard className="w-5 h-5 mr-2" /> Pay ₹615 via Razorpay
      </button>
    </div>
  </div>
);

const SlidePatientPortal = () => (
  <div className="h-full flex flex-col bg-white">
    <div className="border-b border-stone-200 p-4 px-6 flex justify-between items-center bg-stone-50 mt-2 shrink-0">
      <div>
        <h2 className="text-lg font-bold text-gray-900">My Health Thread</h2>
        <div className="text-xs text-gray-500">Rohan Kumar (34, M, O+)</div>
      </div>
    </div>
    
    <div className="p-6 flex-1 overflow-y-auto space-y-6">
      
      {/* Upcoming / Active */}
      <div className="relative">
        <Badge num="1" />
        <div className="absolute top-4 -left-4 w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.1)]"></div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 pl-2">Upcoming</h3>
        
        <div className="bg-white border-2 border-teal-600 rounded-xl p-4 shadow-sm ml-2">
          <div className="flex justify-between items-start mb-1">
            <div className="font-semibold text-gray-900">Dr. Arun Sharma</div>
            <div className="text-xs font-bold bg-teal-100 text-teal-800 px-2 py-1 rounded">Today 10:30 AM</div>
          </div>
          <div className="text-sm text-gray-500 mb-4">Online Consult • Viral Fever</div>
          <button className="w-full bg-teal-700 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center hover:bg-teal-800">
            Join Video Room
          </button>
        </div>
      </div>

      {/* Past Timeline */}
      <div className="relative mt-8">
        <Badge num="2" />
        <div className="absolute top-1 left-2 w-0.5 h-full bg-stone-200 -z-10 -translate-x-1/2"></div>
        
        <div className="relative pl-6 mb-6">
          <div className="absolute top-1.5 left-2 w-2.5 h-2.5 rounded-full bg-stone-300 -translate-x-1/2 border-2 border-white"></div>
          <div className="text-sm font-semibold text-gray-900 mb-2">12 Apr 2025</div>
          <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm flex items-start">
             <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 mr-3 mt-1">
               <FileText className="w-5 h-5 text-gray-400" />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-semibold text-gray-900 truncate">Dr. Arun Sharma</div>
               <div className="text-xs text-gray-500 truncate mb-1">Consultation • Viral Pyrexia</div>
               <div className="text-xs font-semibold text-teal-700 bg-teal-50 inline-block px-2 py-1 rounded border border-teal-100">
                 Rx: Paracetamol 500mg (1-0-1)
               </div>
             </div>
             <div className="flex flex-col space-y-1">
                <button className="p-1.5 text-gray-400 hover:text-teal-700 bg-stone-50 rounded-md border border-stone-200"><Download className="w-3.5 h-3.5"/></button>
                <button className="p-1.5 text-gray-400 hover:text-teal-700 bg-stone-50 rounded-md border border-stone-200"><Share2 className="w-3.5 h-3.5"/></button>
             </div>
          </div>
        </div>

        <div className="relative pl-6 mb-6">
          <div className="absolute top-1.5 left-2 w-2.5 h-2.5 rounded-full bg-stone-300 -translate-x-1/2 border-2 border-white"></div>
          <div className="text-sm font-semibold text-gray-900 mb-2">10 Apr 2025</div>
          <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm flex items-start">
             <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 mr-3 mt-1">
               <FileBarChart className="w-5 h-5 text-gray-400" />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-sm font-semibold text-gray-900 truncate">Self Uploaded</div>
               <div className="text-xs text-gray-500 truncate">Blood Report (CBC)</div>
             </div>
             <div className="flex flex-col space-y-1">
                <button className="p-1.5 text-gray-400 hover:text-teal-700 bg-stone-50 rounded-md border border-stone-200"><Download className="w-3.5 h-3.5"/></button>
                <button className="p-1.5 text-gray-400 hover:text-teal-700 bg-stone-50 rounded-md border border-stone-200"><Share2 className="w-3.5 h-3.5"/></button>
             </div>
          </div>
        </div>
        
      </div>
      
    </div>
  </div>
);


// --- SLIDE DATA (STORY + DEMOS) ---

const slides = [
  // --- INTRO STORY SLIDES ---
  {
    type: 'intro',
    title: 'The Invisible Digital Divide',
    visual: (
      <div className="flex items-center justify-center space-x-12 mb-8 mt-4">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-stone-100 rounded-2xl flex items-center justify-center border-4 border-stone-200 shadow-sm">
            <Building className="w-12 h-12 text-stone-400" />
          </div>
          <p className="mt-4 font-bold text-stone-500 uppercase tracking-widest text-xs">Tier 1: ERPs</p>
        </div>
        
        <div className="text-stone-300 font-black text-4xl pb-8">?</div>
        
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 bg-teal-50 rounded-full flex items-center justify-center border-4 border-teal-200 shadow-xl relative z-10 scale-110">
            <User className="w-16 h-16 text-teal-700" />
          </div>
          <p className="mt-4 font-bold text-teal-700 uppercase tracking-widest text-xs">Independent Doctor</p>
        </div>

        <div className="text-stone-300 font-black text-4xl pb-8">?</div>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-stone-100 rounded-2xl flex items-center justify-center border-4 border-stone-200 shadow-sm">
            <Search className="w-12 h-12 text-stone-400" />
          </div>
          <p className="mt-4 font-bold text-stone-500 uppercase tracking-widest text-xs">Tier 2: Discovery</p>
        </div>
      </div>
    ),
    content: (
      <>
        <p>Most healthcare software is built for two extremes.</p>
        <p className="text-stone-500">Tier 1 systems are heavy, expensive ERPs built for massive hospital compliance. Tier 2 systems are aggregator platforms built for marketing and discoverability.</p>
        <p className="text-stone-500 mt-4">Independent, mobile physicians are left stranded in the middle.</p>
      </>
    )
  },
  {
    type: 'intro',
    title: 'The Reality of Private Practice',
    visual: (
      <div className="flex items-center justify-center mb-8 mt-4">
        <div className="relative w-72 h-48">
          <div className="absolute top-4 left-0 w-36 h-36 bg-rose-50 rounded-3xl flex items-center justify-center border-2 border-rose-200 rotate-[-15deg] shadow-lg">
            <FileText className="w-16 h-16 text-rose-400" />
          </div>
          <div className="absolute top-10 right-0 w-36 h-36 bg-stone-100 rounded-3xl flex items-center justify-center border-2 border-stone-300 rotate-[15deg] shadow-lg">
            <Phone className="w-16 h-16 text-stone-500" />
          </div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-50 rounded-3xl flex items-center justify-center border-2 border-amber-200 rotate-[0deg] shadow-2xl z-10">
            <FileBarChart className="w-20 h-20 text-amber-500" />
          </div>
        </div>
      </div>
    ),
    content: (
      <>
        <p>Current platforms act as digital billboards, not clinical tools.</p>
        <p className="text-stone-500">Because these systems are bloated or ill-suited for daily operations, doctors use them just to get patients in the door. Once inside, they revert to manual pen-and-paper, fragmented spreadsheets, and chaotic messaging apps to actually run their clinic.</p>
      </>
    )
  },
  {
    type: 'intro',
    title: 'The Multi-Clinic Context Switch',
    visual: (
      <div className="flex items-center justify-center space-x-6 relative mb-8 mt-4">
        <div className="w-32 h-32 bg-stone-100 rounded-full flex flex-col items-center justify-center border-4 border-stone-200 z-10 shadow-sm">
          <span className="block font-bold text-stone-600 text-lg">Clinic A</span>
          <span className="block text-xs text-stone-400 uppercase tracking-widest mt-1">Morning</span>
        </div>
        
        <div className="w-48 h-1 border-t-4 border-dashed border-stone-300 relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-teal-50 px-5 py-2 rounded-full border border-teal-200 text-teal-700 font-bold flex items-center shadow-md whitespace-nowrap">
            <Smartphone className="w-4 h-4 mr-2" />
            Data follows you
          </div>
        </div>

        <div className="w-32 h-32 bg-stone-100 rounded-full flex flex-col items-center justify-center border-4 border-stone-200 z-10 shadow-sm">
          <span className="block font-bold text-stone-600 text-lg">Clinic B</span>
          <span className="block text-xs text-stone-400 uppercase tracking-widest mt-1">Evening</span>
        </div>
      </div>
    ),
    content: (
      <>
        <p>A doctor might be at Clinic A in the morning, and Clinic B in the evening.</p>
        <p className="text-stone-500">They desperately need their patient data to follow them securely on a lightweight app, without needing to sync with a specific clinic's local, legacy server.</p>
      </>
    )
  },
  {
    type: 'intro',
    title: 'Introducing CURO',
    visual: (
      <div className="flex justify-center mb-8 mt-4">
        <div className="w-48 h-48 bg-gradient-to-br from-teal-500 to-teal-700 rounded-[3rem] shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-all duration-500">
          <Activity className="w-24 h-24 text-white" />
        </div>
      </div>
    ),
    content: (
      <>
        <p>CURO is a Frictionless Clinical Operating System.</p>
        <p className="text-stone-500">We stripped away the enterprise bloat. Instead of another rigid management database, CURO focuses entirely on high-velocity, essential workflows: rapid charting, seamless scheduling, and lightweight history tracking.</p>
      </>
    )
  },
  {
    type: 'intro',
    title: 'Zero Memory Burden',
    visual: (
      <div className="flex items-center justify-center mb-8 mt-4">
        <div className="w-48 h-48 bg-stone-900 rounded-full flex items-center justify-center relative shadow-2xl border-8 border-stone-100">
          <div className="absolute inset-0 bg-teal-500 opacity-20 rounded-full animate-ping"></div>
          <Brain className="w-20 h-20 text-teal-400 relative z-10" />
          <div className="absolute -bottom-4 bg-teal-500 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">AI Summaries</div>
        </div>
      </div>
    ),
    content: (
      <>
        <p>A doctor should never waste time trying to remember a patient's history.</p>
        <p className="text-stone-500">With CURO, the burden of memory is entirely removed. Before the patient even walks in, you are handed an instant AI summary of their past diagnoses alongside all their newly uploaded reports. You start every consultation with total context.</p>
      </>
    )
  },
  {
    type: 'intro',
    title: 'The 60-Second Rule',
    visual: (
      <div className="flex items-center justify-center mb-8 mt-4">
        <div className="w-48 h-48 rounded-full border-[12px] border-stone-100 flex items-center justify-center relative bg-white shadow-xl">
          <div className="absolute inset-0 rounded-full border-[12px] border-teal-500 border-l-transparent border-b-transparent transform rotate-45"></div>
          <div className="text-center">
            <span className="block text-6xl font-black text-stone-900">&lt;60</span>
            <span className="block text-sm font-bold text-stone-400 uppercase tracking-widest mt-1">Seconds</span>
          </div>
        </div>
      </div>
    ),
    content: (
      <>
        <p>Independent doctors face a massive time crunch.</p>
        <p className="text-stone-500">If software takes more than 60 seconds to write a prescription or log a diagnosis, doctors will abandon it. CURO respects the doctor's time and transforms software from an administrative chore back into a clinical utility.</p>
        <p className="text-teal-600 mt-10 font-bold tracking-wide">Let's see how it works.</p>
      </>
    )
  },

  // --- INTERACTIVE DEMO SLIDES (DOCTOR) ---
  { 
    type: 'demo',
    title: "Clinic Setup", 
    isMobileLayout: false,
    component: <SlideDoctorSetup />,
    features: [
      { title: "Instant Payments", desc: "Link your bank account once. All patient payments go directly to you without manual verification or chasing screenshots." },
      { title: "Flexible Consultations", desc: "Easily set different fees for online video consults vs in-clinic visits. Video links are generated automatically." },
      { title: "Total Control", desc: "Set your exact working hours. The system automatically manages your slots so you're never double booked." }
    ]
  },
  { 
    type: 'demo',
    title: "The Doctor's Morning", 
    isMobileLayout: false,
    component: <SlideDashboard />,
    features: [
      { title: "No Confusing Charts", desc: "Instead of massive revenue graphs, we give you a clean, simple strip showing exactly what you need: how many patients, how much collected, and who hasn't paid." },
      { title: "Patient Snapshot", desc: "See your next patient instantly. The system automatically highlights their complaint and gives you a summary of their past visits before they even enter the room." },
      { title: "Clear Scheduling", desc: "A simple, color-coded list of today's appointments. You can scan your entire day without clicking anywhere." }
    ]
  },
  { 
    type: 'demo',
    title: "Patient Database", 
    isMobileLayout: false,
    component: <SlideDoctorDatabase />,
    features: [
      { title: "Search First", desc: "Instantly find any patient by name, phone number, or condition without navigating complex menus." },
      { title: "Global Record", desc: "A clean, organized view of everyone you have ever treated, tracking total visits and last consultation date." }
    ]
  },
  { 
    type: 'demo',
    title: "The Consultation", 
    isMobileLayout: false,
    component: <SlideConsultation />,
    features: [
      { title: "Patient History at a Glance", desc: "Everything they've ever shared with you—past prescriptions, lab reports—is neatly organized on the left. It feels like an ongoing conversation, not a spreadsheet." },
      { title: "Smart Summary", desc: "The system reads their history and their current complaint, writing a quick summary for you." },
      { title: "Distraction-Free Notes", desc: "A big, clean space to write your clinical notes without any pop-ups or menus getting in your way." }
    ]
  },
  { 
    type: 'demo',
    title: "Writing Prescriptions", 
    isMobileLayout: false,
    component: <SlidePrescription />,
    features: [
      { title: "Everything on One Screen", desc: "You don't need to open five different windows to add medicines, lab tests, and advice. It's all right here." },
      { title: "Fast Typing", desc: "The system auto-completes medicine names and makes it incredibly easy to quickly type out dosages." },
      { title: "One Click Delivery", desc: "Click the button and the system generates a professional PDF and sends it straight to the patient's WhatsApp." }
    ]
  },

  // --- INTERACTIVE DEMO SLIDES (PATIENT) ---
  { 
    type: 'demo',
    title: "Patient Entry Points", 
    isMobileLayout: true,
    component: <SlidePatientEntry />,
    features: [
      { title: "A Single Link", desc: "No app downloads required. Doctors simply put their CURO link in their WhatsApp bio or Instagram profile." },
      { title: "Desk QR Codes", desc: "Patients in the waiting room can just point their smartphone camera at a QR code tent card on the receptionist's desk to instantly join the digital queue." }
    ]
  },
  { 
    type: 'demo',
    title: "CURO App Directory", 
    isMobileLayout: true,
    component: <SlideDoctorDirectory />,
    features: [
      { title: "Browse by Need", desc: "For patients using the main CURO app, they can quickly discover top-rated doctors in their immediate vicinity based on symptoms or specialty." },
      { title: "Transparent Availability", desc: "Patients instantly see a doctor's exact consultation fee and when their next available slot is before even clicking their profile." }
    ]
  },
  { 
    type: 'demo',
    title: "Patient Books a Slot", 
    isMobileLayout: true,
    component: <SlidePatientSlot />,
    features: [
      { title: "Frictionless First Step", desc: "Whether scanning a QR code or clicking from the directory, the first thing patients see is the doctor's availability. No login walls." },
      { title: "Clear Slot Selection", desc: "A clean calendar instantly shows what times are available today or tomorrow." }
    ]
  },
  { 
    type: 'demo',
    title: "Frictionless Login", 
    isMobileLayout: true,
    component: <SlidePatientLogin />,
    features: [
      { title: "Zero Passwords", desc: "Once they select a slot, they simply type in their phone number to enter. No remembering complex passwords or dealing with forgotten login emails." },
      { title: "Immediate Access", desc: "A secure OTP is sent directly to their phone, getting them back to the booking screen in seconds." }
    ]
  },
  { 
    type: 'demo',
    title: "Symptoms & Payment", 
    isMobileLayout: true,
    component: <SlidePatientComplaint />,
    features: [
      { title: "Rich Context", desc: "Patients just enter their symptoms and can even upload a photo of a lab report right from their phone." },
      { title: "Upfront Payments", desc: "They lock in the slot by paying immediately through Razorpay or UPI. No more chasing patients for screenshots." }
    ]
  },
  { 
    type: 'demo',
    title: "The Patient's Record", 
    isMobileLayout: true,
    component: <SlidePatientPortal />,
    features: [
      { title: "Active Appointments", desc: "Patients get a clear view of their upcoming appointments, with a direct 'Join Video Room' button right on top." },
      { title: "Detailed Prescriptions", desc: "Past visits explicitly list the prescribed medicines, so patients don't have to guess what they took." },
      { title: "Secure Sharing", desc: "If a patient needs to see another specialist, they can quickly share or download the exact prescription directly from the timeline." }
    ]
  },

  // --- CONCLUSION SLIDES ---
  {
    type: 'intro',
    title: 'In Simple Terms',
    content: (
      <div className="flex flex-col space-y-8 text-left max-w-2xl mx-auto mt-8">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 mr-6 mt-1 shadow-sm">✕</div>
          <div>
            <p className="font-bold text-stone-900 text-2xl m-0">Doctors forget patients.</p>
            <p className="text-teal-700 text-xl mt-1 font-medium">CURO's AI remembers them instantly.</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 mr-6 mt-1 shadow-sm">✕</div>
          <div>
            <p className="font-bold text-stone-900 text-2xl m-0">Chasing patients for payments.</p>
            <p className="text-teal-700 text-xl mt-1 font-medium">Patients pay upfront to book a slot.</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 mr-6 mt-1 shadow-sm">✕</div>
          <div>
            <p className="font-bold text-stone-900 text-2xl m-0">Clunky hospital software.</p>
            <p className="text-teal-700 text-xl mt-1 font-medium">Write a prescription in under 60 seconds.</p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 mr-6 mt-1 shadow-sm">✕</div>
          <div>
            <p className="font-bold text-stone-900 text-2xl m-0">Patients hate downloading apps.</p>
            <p className="text-teal-700 text-xl mt-1 font-medium">A single link opens directly in their browser.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    type: 'intro',
    title: 'The Future of Independent Practice',
    content: (
      <>
        <div className="w-24 h-24 bg-teal-50 text-teal-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-teal-100">
          <Stethoscope className="w-12 h-12" />
        </div>
        <p className="text-5xl font-bold text-teal-900 mb-4">CURO</p>
        <p className="text-stone-500 text-2xl tracking-wide uppercase font-semibold">Fast. Private. Frictionless.</p>
      </>
    )
  }
];

function App() {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  
  const handleNext = useCallback(() => {
    setStep(s => Math.min(slides.length - 1, s + 1));
  }, []);

  const handlePrev = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <SlideWrapper 
      step={step} 
      totalSteps={slides.length}
      slide={slide}
      onNext={handleNext}
      onPrev={handlePrev}
    >
      {slide.component}
    </SlideWrapper>
  );
}

export default App;
