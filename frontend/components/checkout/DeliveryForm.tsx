import Field, { inputCls } from "./Field";

export default function DeliveryForm() {
  return (
    <section className="rounded-[18px] bg-white p-5 sm:p-8">
      <h2 className="text-[21px] font-semibold leading-[25px]">Thông tin giao hàng</h2>
      <p className="mt-2 text-xs text-[#82776E]">
        Vui lòng điền đầy đủ thông tin để chúng tôi có thể giao hàng đến bạn.
      </p>
      <div className="mt-[21px] grid gap-x-[26px] gap-y-[22px] sm:grid-cols-2">
        <Field label="Họ và tên *">
          <input required className={inputCls} placeholder="e.g. Nguyen Minh Anh" />
        </Field>
        <Field label="Số điện thoại *">
          <input required type="tel" className={inputCls} placeholder="+84  9xx xxx xxx" />
        </Field>
        <Field label="Địa chỉ đường *" className="sm:col-span-2">
          <input required className={inputCls} placeholder="Số nhà, tên đường, toà nhà" />
        </Field>
        {/* <Field label="Quận *">
          <select required defaultValue="" className={`${inputCls} text-[#82776E] invalid:text-[#82776E]`}>
            <option value="" disabled>Chọn Quận...</option>
            <option>District 1</option>
            <option>District 3</option>
            <option>District 7</option>
            <option>Binh Thanh</option>
          </select>
        </Field> */}
        <Field label="Phường">
          <select defaultValue="" className={`${inputCls} text-[#82776E]`}>
            <option value="" disabled>Chọn Phường...</option>
            <option>Bến Nghé</option>
            <option>Bến Thành</option>
            <option>Sài Gòn</option>
          </select>
        </Field>
        <Field label="Ghi chú (tùy chọn)" className="sm:col-span-2">
          <input
            className="h-9 w-full rounded-lg border border-[#E3DACF] bg-white px-4 text-[11px] outline-none placeholder:text-[#82776E] focus:border-[#B9672B]"
            placeholder="Để ở quầy lễ tân, giảm lượng đường, v.v."
          />
        </Field>
      </div>
    </section>
  );
}
