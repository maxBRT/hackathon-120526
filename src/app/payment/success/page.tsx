import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Thanks for paying</CardTitle>
          <CardDescription>
            Stripe has confirmed your checkout. Your payment status updates from our server once
            processing finishes (usually within a few seconds).
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-2">
          <Link href="/my-requests" className={buttonVariants({ variant: "default" })}>
            My requests
          </Link>
          <Link href="/tournaments" className={buttonVariants({ variant: "outline" })}>
            Tournaments
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
