import { supabase } from '../../supabase-client.js';

export function renderSignupView(root) {
  if (!root) return;
  root.className = '';
  root.innerHTML = `
    <div class="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden">
      <div class="layout-container flex h-full grow flex-col">
        <div class="flex flex-1 justify-center">
          <div class="layout-content-container flex flex-col w-full flex-1">
            <main class="flex-1">
              <div class="flex min-h-screen">
                <div class="flex flex-1 flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
                  <div class="w-full max-w-md space-y-8">
                    <div class="flex flex-col items-center text-center">
                      <div class="flex items-center justify-center gap-3 mb-4">
                        <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <span class="material-symbols-outlined text-white text-3xl">widgets</span>
                        </div>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">Enterprise</p>
                      </div>
                      <div class="flex flex-col gap-3">
                        <p class="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Create an Account</p>
                        <p class="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Get started with our enterprise app store.</p>
                      </div>
                    </div>
                    <form id="signup-form" class="space-y-6">
                      <label class="flex flex-col w-full">
                        <p class="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Full Name</p>
                        <input id="signup-full-name" class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal" placeholder="Enter your full name" value="" />
                      </label>
                      <label class="flex flex-col w-full">
                        <p class="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Email Address</p>
                        <input id="signup-email" class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal" placeholder="Enter your email address" type="email" value="" />
                      </label>
                      <div class="flex flex-col gap-2">
                        <label class="flex flex-col w-full">
                          <p class="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Password</p>
                          <div class="flex w-full flex-1 items-stretch rounded-lg">
                            <input id="signup-password" class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal" placeholder="Enter your password" type="password" value="" />
                            <div class="text-gray-500 dark:text-gray-400 flex border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                              <span id="toggleSignupPassword" class="material-symbols-outlined cursor-pointer">visibility</span>
                            </div>
                          </div>
                        </label>
                      </div>
                      <div class="flex flex-col gap-2">
                        <label class="flex flex-col w-full">
                          <p class="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">Confirm Password</p>
                          <div class="flex w-full flex-1 items-stretch rounded-lg">
                            <input id="signup-confirm-password" class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal" placeholder="Confirm your password" type="password" value="" />
                            <div class="text-gray-500 dark:text-gray-400 flex border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                              <span class="material-symbols-outlined">visibility_off</span>
                            </div>
                          </div>
                        </label>
                      </div>
                      <div class="flex flex-col gap-4 pt-2">
                        <button type="submit" class="flex items-center justify-center font-semibold text-base text-white h-14 w-full rounded-lg bg-primary hover:bg-primary/90 transition-colors">Create Account</button>
                        <div class="text-center">
                          <p class="text-sm text-gray-500 dark:text-gray-400">Already have an account? <a id="go-to-login" class="font-semibold text-primary hover:text-primary/80" href="javascript:void(0)">Sign In</a></p>
                        </div>
                        <div id="signup-error" class="text-sm text-red-500 dark:text-red-400"></div>
                        <div id="signup-success" class="text-sm text-green-500 dark:text-green-400"></div>
                      </div>
                    </form>
                  </div>
                  <div class="pt-16 text-center">
                    <p class="text-sm text-gray-500 dark:text-gray-400">© 2024 Enterprise Corp. All rights reserved.</p>
                  </div>
                </div>
                <div class="hidden lg:flex flex-1 bg-gray-100 dark:bg-gray-900 items-center justify-center p-8">
                  <div class="w-full h-full bg-center bg-no-repeat bg-cover rounded-xl" data-alt="Abstract geometric pattern with blue and grey shapes, conveying a corporate and technological feel." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjSq5CZEq-0JLINK65NXNpfEC-Y6IdpiEovmdF60nkhIzygGzn7a7CQ-TiEFN7LzBnXPvFb_5Qt_H1qJHeW5L03ZRRNusRcNlr6VFPdaiCwAJEfZKR0QNKvfnnAi4rNq4aiPXX3DCw0U0hNchclOj3-SwIFFNJnYATvCGn0rhGW_qk_xkt8aYOc9r8hnUN2ITNCl3XvtOln55JPdKGy5Ycyr6pRx4D17-qjQJafjuKeStit2LclHlMUoPHG5TBq9anLtIohUIGq7A');"></div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  `;

  const form = root.querySelector('#signup-form');
  const fullNameInput = root.querySelector('#signup-full-name');
  const emailInput = root.querySelector('#signup-email');
  const passwordInput = root.querySelector('#signup-password');
  const togglePassword = root.querySelector('#toggleSignupPassword');
  const errorBox = root.querySelector('#signup-error');
  const successBox = root.querySelector('#signup-success');
  const goToLogin = root.querySelector('#go-to-login');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePassword.textContent = isPassword ? 'visibility_off' : 'visibility';
    });
  }

  if (goToLogin) {
    goToLogin.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = '#/login';
    });
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (errorBox) errorBox.textContent = '';
      if (successBox) successBox.textContent = '';

      const fullName = fullNameInput?.value.trim() || '';
      const email = emailInput?.value.trim();
      const password = passwordInput?.value || '';

      if (!email || !password) {
        if (errorBox) errorBox.textContent = 'Email and password are required.';
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || null }
        }
      });

      if (error) {
        console.error(error);
        if (errorBox) errorBox.textContent = error.message || 'Sign up failed.';
        return;
      }

      const user = data?.user;
      if (!user) {
        if (errorBox) errorBox.textContent = 'Sign up succeeded but user is missing.';
        return;
      }

      const { error: accountError } = await supabase
        .from('accounts')
        .upsert(
          {
            id: user.id,
            email,
            full_name: fullName || null
          },
          { onConflict: 'id' }
        );

      if (accountError) {
        console.error(accountError);
        if (errorBox) errorBox.textContent = 'Account created but profile could not be saved.';
        return;
      }

      if (successBox) successBox.textContent = 'Account created successfully! Redirecting to login…';

      window.setTimeout(() => {
        window.location.hash = '#/login';
      }, 1500);
    });
  }
}
