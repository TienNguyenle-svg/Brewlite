import Field, { inputCls } from "./Field";

export default function DeliveryForm() {
  return (
    <section className="rounded-[18px] bg-white p-5 sm:p-8">
      <h2 className="text-[21px] font-semibold leading-[25px]">Delivery details</h2>
      <p className="mt-2 text-xs text-[#82776E]">
        Where should we send your favorites?
      </p>
      <div className="mt-[21px] grid gap-x-[26px] gap-y-[22px] sm:grid-cols-2">
        <Field label="Full name *">
          <input required className={inputCls} placeholder="e.g. Nguyen Minh Anh" />
        </Field>
        <Field label="Phone number *">
          <input required type="tel" className={inputCls} placeholder="+84  9xx xxx xxx" />
        </Field>
        <Field label="Street address *" className="sm:col-span-2">
          <input required className={inputCls} placeholder="House number, street name, building" />
        </Field>
        <Field label="District *">
          <select required defaultValue="" className={`${inputCls} text-[#82776E] invalid:text-[#82776E]`}>
            <option value="" disabled>Select district</option>
            <option>District 1</option>
            <option>District 3</option>
            <option>District 7</option>
            <option>Binh Thanh</option>
          </select>
        </Field>
        <Field label="Ward">
          <select defaultValue="" className={`${inputCls} text-[#82776E]`}>
            <option value="" disabled>Select ward</option>
            <option>Ben Nghe</option>
            <option>Ben Thanh</option>
            <option>Da Kao</option>
          </select>
        </Field>
        <Field label="Delivery note (optional)" className="sm:col-span-2">
          <input
            className="h-9 w-full rounded-lg border border-[#E3DACF] bg-white px-4 text-[11px] outline-none placeholder:text-[#82776E] focus:border-[#B9672B]"
            placeholder="Leave at reception, less sugar, etc."
          />
        </Field>
      </div>
    </section>
  );
}
