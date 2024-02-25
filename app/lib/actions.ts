'use server';

import {z} from "zod";
import {sql} from "@vercel/postgres";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {AuthError} from "next-auth";
import {signIn} from "@/auth";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    required_error: "Please select a customer.",
  }),
  amount: z.coerce.number().gt(0, {message: "Please enter an amount greater than zero."}),
  status: z.enum(['pending', 'paid'], {
    required_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoiceSchema = FormSchema.omit({id: true, date: true});
const UpdateInvoiceSchema = FormSchema.omit({id: true, date: true});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(previousState: State, formData: FormData): Promise<State> {
  // validate data
  const validatedParsedFormData = CreateInvoiceSchema.safeParse(Object.fromEntries(formData.entries()));

  // handle errors
  if (!validatedParsedFormData.success) {
    return {
      errors: validatedParsedFormData.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // destructure data
  const {
    customerId,
    amount: amountDollars,
    status,
  } = validatedParsedFormData.data;
  const amountCents = amountDollars * 100;
  const date = new Date().toISOString().split('T')[0]; // T is for time, we only want the date

  // insert data into database
  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountCents}, ${status}, ${date})
    `;
  } catch (error) {
    // @ts-ignore
    return {
      "message": "Failed to create invoice."
    }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, previousState: State, formData: FormData): Promise<State> {
  // validate data w/ zod
  const validatedParsedFormData = await UpdateInvoiceSchema.spa(Object.fromEntries(formData.entries()));

  // check for errors
  if (!validatedParsedFormData.success) {
    return {
      errors: validatedParsedFormData.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to edit Invoice.',
    };
  }

  // no errors, good to proceed with destructuring
  const {customerId, amount: amountInDollars, status} = validatedParsedFormData.data;
  const amountInCents = amountInDollars * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId},
            amount      = ${amountInCents},
            status      = ${status}
        WHERE id = ${id}
    `;
  } catch (error) {
    // @ts-ignore
    return {
      "message": "Failed to update invoice."
    }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices'); // must lie outside of try/catch
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE
              FROM invoices
              WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    // @ts-ignore
    return {
      "message": "Invoice deleted successfully."
    }
  } catch (error) {
    // @ts-ignore
    return {
      "message": "Failed to delete invoice."
    }
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

