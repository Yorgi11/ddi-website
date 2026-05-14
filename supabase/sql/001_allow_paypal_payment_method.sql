alter table public.payments
drop constraint if exists payments_payment_method_check;

alter table public.payments
add constraint payments_payment_method_check
check (payment_method in ('etransfer', 'stripe', 'paypal'));
