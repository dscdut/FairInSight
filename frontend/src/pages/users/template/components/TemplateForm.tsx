import { Input } from '@/components/ui/input'
import { type Template } from '@/models/types/form-library'

interface TemplateFormProps {
  template: Template
  formValues: Record<string, string>
  onInputChange: (key: string, value: string) => void
}

export default function TemplateForm({ template, formValues, onInputChange }: TemplateFormProps) {
  return (
    <div className='lg:col-span-5 bg-background-secondary border border-border-secondary rounded-lg p-5 shadow-100 space-y-6 lg:h-[calc(100vh-160px)] overflow-y-auto'>
      {template.fields?.map((sec, secIdx) => (
        <div key={secIdx} className='space-y-4 border-b border-border-secondary/55 pb-6 last:border-b-0 last:pb-0'>
          <h3 className='text-h5 text-text-primary text-left'>
            {sec.section}
          </h3>
          
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {sec.inputs.map((input) => (
              <div 
                key={input.key} 
                className={
                  input.key === 'contractNumber' || 
                  input.key === 'ownerName' || 
                  input.key === 'businessName' || 
                  input.key === 'officeAddress' || 
                  input.key === 'lessorName' || 
                  input.key === 'lessorAddress'
                    ? 'sm:col-span-2 space-y-1 text-left' 
                    : 'space-y-1 text-left'
                }
              >
                <label className='text-sm font-medium text-text-secondary flex items-center gap-0.5'>
                  {input.label}
                  {input.required && <span className='text-error-primary'>*</span>}
                </label>

                {input.disabled ? (
                  <div className='relative'>
                    <Input
                      value={formValues[input.key]}
                      disabled
                      className='h-11 bg-background-secondary/30 border-border-secondary text-xs rounded-md font-semibold text-text-description'
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-btn-tiny font-bold uppercase tracking-wider text-text-tertiary bg-background-secondary px-1.5 py-0.5 rounded border border-border-secondary/60'>
                      Disabled
                    </span>
                  </div>
                ) : (
                  <Input
                    type={input.type}
                    value={formValues[input.key]}
                    onChange={(e) => onInputChange(input.key, e.target.value)}
                    placeholder={`Nhập ${input.label.toLowerCase()}...`}
                    className='border-border-secondary focus:border-primary focus:bg-background-primary transition-all text-sm rounded-xs text-text-primary font-medium'
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
