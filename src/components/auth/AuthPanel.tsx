import { Clock, Shield, Package2 } from 'lucide-react';
const features = [{
  icon: <Clock className="w-5 h-5" />,
  text: 'Real-time ETD & delivery tracking'
}, {
  icon: <Shield className="w-5 h-5" />,
  text: 'Secure & reliable logistics'
}, {
  icon: <Package2 className="w-5 h-5" />,
  text: 'End-to-end delivery management'
}];
export default function AuthPanel() {
  return <div className='hidden lg:flex w-[45%] text-primary-foreground flex-col justify-center p-14 bg-[#991d6e]'>
      <div className="space-y-8 max-w-sm">
        <div className="space-y-3">
          <p className='uppercase tracking-widest opacity-[1] font-[family-name:Poppins,_sans-serif] font-extrabold text-2xl text-[#ff0318]'>Bombax Logistics</p>
        </div>
        <p className="text-sm opacity-70 leading-relaxed">
          Bombax Couriers LLP is a fast, reliable, and trustworthy international courier service
          operating from 100+ locations across India.
        </p>
        <div className="space-y-3">
          {features.map((f, i) => <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <span className="text-sm opacity-90 font-medium">{f.text}</span>
            </div>)}
        </div>
      </div>
    </div>;
}