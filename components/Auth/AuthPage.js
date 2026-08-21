import { getProfileStorageKey } from '../../utils/storage.js';

export function getAuthPageHTML() {
  return `
    <!-- Tailwind & Font & Icons CDN -->
    <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/style.css">
    <link rel="stylesheet" href="./components/Auth/AuthPage.css">

    <div class="auth-wrapper rounded-3xl w-full">
      <!-- Background Ambient Glows -->
      <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0052cc]/10 rounded-full blur-[120px] animate-float pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#00b4d8]/5 rounded-full blur-[120px] animate-float pointer-events-none" style="animation-delay: -3s;"></div>

      <!-- Main Container -->
      <div class="w-full max-w-6xl h-auto min-h-[75vh] glass-panel rounded-3xl overflow-hidden flex shadow-2xl relative z-10">
          
          <!-- Left Side: Visuals (Hidden on mobile) -->
          <div class="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900">
              <img id="side-image" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" alt="Luxury Fashion" class="absolute inset-0 w-full h-full object-cover opacity-50 hover:scale-105 transition-transform duration-[10s] ease-linear">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50"></div>
              
              <div class="relative z-10 flex flex-col justify-between h-full p-12">
                  <div>
                      <h1 class="text-4xl font-bold tracking-tighter text-white mb-2">SWEETOS</h1>
                      <p class="text-slate-300 text-sm tracking-widest uppercase">Curated Excellence</p>
                  </div>
                  
                  <div class="mb-12">
                      <h2 class="text-5xl font-light leading-tight mb-6">Elevate your <br><span class="font-semibold text-gradient">lifestyle.</span></h2>
                      <p class="text-slate-400 max-w-xs leading-relaxed">Join an exclusive community of trendsetters. Access limited drops and personalized collections.</p>
                  </div>

                  <div class="flex gap-4 text-slate-500 text-sm">
                      <span>&copy; 2026 SWEETOS Inc.</span>
                      <span>•</span>
                      <span>Privacy</span>
                      <span>•</span>
                      <span>Terms</span>
                  </div>
              </div>
          </div>

          <!-- Right Side: Forms (Light Themed to match screenshot) -->
          <div class="w-full lg:w-1/2 p-8 md:p-10 lg:p-12 flex flex-col justify-center relative light-glass-column text-gray-800">
              
              <!-- Mobile Logo -->
              <div class="lg:hidden absolute top-8 left-8 text-2xl font-bold tracking-tighter text-gray-800">SWEETOS</div>

              <!-- Form Container -->
              <div class="w-full max-w-md mx-auto py-4">

                  <!-- LOGIN FORM -->
                  <form id="login-form" class="fade-in-up block">
                      <!-- Login Header Icon -->
                      <div class="flex flex-col items-center mb-6">
                        <div class="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center text-brand mb-3">
                          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">Welcome Back</h3>
                        <p class="text-gray-500 text-sm mt-1">Sign in to SWEETOS</p>
                      </div>

                      <!-- Google Button -->
                      <div id="google-login-btn-container" class="w-full mb-6 flex justify-center" style="min-height: 44px;"></div>

                      <div class="relative flex py-2 items-center mb-6">
                          <div class="flex-grow border-t border-gray-200"></div>
                          <span class="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">Or sign in with email</span>
                          <div class="flex-grow border-t border-gray-200"></div>
                      </div>

                      <div class="space-y-4">
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                              <div class="relative">
                                  <i class="ph ph-envelope-simple absolute left-4 top-3.5 text-gray-400"></i>
                                  <input type="email" id="signin-email" placeholder="you@example.com" required autocomplete="email" class="light-input-field w-full pl-11 pr-4 py-3 rounded-xl text-sm">
                              </div>
                          </div>
                          
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                              <div class="relative">
                                  <i class="ph ph-lock-key absolute left-4 top-3.5 text-gray-400"></i>
                                  <input type="password" id="signin-password" placeholder="Enter your password" required autocomplete="current-password" class="light-input-field w-full pl-11 pr-10 py-3 rounded-xl text-sm">
                                  <button type="button" id="toggle-signin-pass" class="absolute right-4 top-3.5 text-gray-400 hover:text-brand transition-colors focus:outline-none">
                                      <i class="ph ph-eye text-lg"></i>
                                  </button>
                              </div>
                          </div>
                      </div>

                      <div class="flex justify-between items-center mt-4 mb-6">
                          <label class="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" class="custom-checkbox custom-checkbox-input">
                              <div class="w-4.5 h-4.5 border border-gray-300 rounded flex items-center justify-center transition-colors bg-white">
                                  <i class="ph ph-check text-[10px] text-white opacity-0 custom-check-icon"></i>
                              </div>
                              <span class="text-xs text-gray-600">Remember me</span>
                          </label>
                          <a href="#" class="text-xs text-brand font-semibold hover:underline">Forgot password?</a>
                      </div>

                      <button type="submit" class="w-full btn-brand font-semibold py-3.5 rounded-xl active:scale-[0.98]">
                          Sign In
                      </button>

                      <div class="mt-6 text-center text-sm text-gray-500">
                          Don't have an account? <a href="#" id="to-signup-link" class="text-brand font-semibold hover:underline">Create Account</a>
                      </div>
                  </form>
                  <form id="register-form" class="hidden fade-in-up">
                      <!-- Register Header Icon -->
                      <div class="flex flex-col items-center mb-6">
                        <div class="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center text-brand mb-3">
                          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="19" y1="8" x2="19" y2="14"></line>
                            <line x1="22" y1="11" x2="16" y2="11"></line>
                          </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">Create Account</h3>
                        <p class="text-gray-500 text-sm mt-1">Join SWEETOS</p>
                      </div>

                      <!-- Google Button -->
                      <div id="google-register-btn-container" class="w-full mb-6 flex justify-center" style="min-height: 44px;"></div>

                      <div class="relative flex py-2 items-center mb-6">
                          <div class="flex-grow border-t border-gray-200"></div>
                          <span class="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider font-semibold">Or sign up with email</span>
                          <div class="flex-grow border-t border-gray-200"></div>
                      </div>

                      <div class="space-y-4">
                          <!-- Full Name -->
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                              <input type="text" id="signup-fullname" placeholder="Jean Dupont" required autocomplete="name" class="light-input-field w-full px-4 py-3 rounded-xl text-sm">
                          </div>

                          <!-- Email Address -->
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                              <input type="email" id="signup-email" placeholder="vous@exemple.com" required autocomplete="email" class="light-input-field w-full px-4 py-3 rounded-xl text-sm">
                          </div>

                          <!-- Password -->
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                              <div class="relative">
                                  <input type="password" id="signup-password" placeholder="Enter your password" required autocomplete="new-password" class="light-input-field w-full pl-4 pr-10 py-3 rounded-xl text-sm">
                                  <button type="button" id="toggle-signup-pass" class="absolute right-3 top-3.5 text-gray-400 hover:text-brand transition-colors focus:outline-none">
                                      <i class="ph ph-eye text-lg"></i>
                                  </button>
                              </div>
                              <span class="block text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                  <i class="ph ph-info text-xs"></i> Password must be at least 6 characters
                              </span>
                          </div>

                          <!-- Phone Number (Prefix Dropdown + Input) -->
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                              <div class="flex gap-2">
                                  <select id="signup-phone-prefix" class="light-input-field px-3 py-3 rounded-xl text-sm bg-white" style="width: 105px;">
                                      <option value="+225" selected>CI +225</option>
                                      <option value="+237">CM +237</option>
                                      <option value="+234">NG +234</option>
                                      <option value="+233">GH +233</option>
                                      <option value="+221">SN +221</option>
                                      <option value="+254">KE +254</option>
                                      <option value="+27">ZA +27</option>
                                      <option value="+212">MA +212</option>
                                      <option value="+216">TN +216</option>
                                      <option value="+213">DZ +213</option>
                                  </select>
                                  <input type="tel" id="signup-phone" placeholder="6XX XXX XXX" required autocomplete="tel" class="flex-1 light-input-field px-4 py-3 rounded-xl text-sm">
                              </div>
                              <span class="block text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                  <i class="ph ph-info text-xs"></i> We will use this to contact you regarding your orders
                              </span>
                          </div>

                          <!-- Shipping Address -->
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Shipping Address</label>
                              <input type="text" id="signup-address" placeholder="123 Main Street, City, Country" required autocomplete="street-address" class="light-input-field w-full px-4 py-3 rounded-xl text-sm">
                              <span class="block text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                  <i class="ph ph-info text-xs"></i> Your default shipping address
                              </span>
                          </div>

                          <!-- Country / Region Selector (50 African Countries) -->
                          <div class="form-group">
                              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Country / Region</label>
                              <select id="signup-country" required class="w-full px-4 py-3 rounded-xl light-input-field text-sm bg-white">
                                  <option value="Ivory Coast" selected>Ivory Coast (Côte d'Ivoire)</option>
                                  <option value="Algeria">Algeria</option>
                                  <option value="Angola">Angola</option>
                                  <option value="Benin">Benin</option>
                                  <option value="Botswana">Botswana</option>
                                  <option value="Burkina Faso">Burkina Faso</option>
                                  <option value="Burundi">Burundi</option>
                                  <option value="Cabo Verde">Cabo Verde</option>
                                  <option value="Cameroon">Cameroon</option>
                                  <option value="Central African Republic">Central African Republic</option>
                                  <option value="Chad">Chad</option>
                                  <option value="Comoros">Comoros</option>
                                  <option value="Congo-Brazzaville">Congo (Brazzaville)</option>
                                  <option value="Congo-Kinshasa">Congo (Kinshasa)</option>
                                  <option value="Djibouti">Djibouti</option>
                                  <option value="Egypt">Egypt</option>
                                  <option value="Equatorial Guinea">Equatorial Guinea</option>
                                  <option value="Eritrea">Eritrea</option>
                                  <option value="Eswatini">Eswatini</option>
                                  <option value="Ethiopia">Ethiopia</option>
                                  <option value="Gabon">Gabon</option>
                                  <option value="Gambia">Gambia</option>
                                  <option value="Ghana">Ghana</option>
                                  <option value="Guinea">Guinea</option>
                                  <option value="Guinea-Bissau">Guinea-Bissau</option>
                                  <option value="Kenya">Kenya</option>
                                  <option value="Lesotho">Lesotho</option>
                                  <option value="Liberia">Liberia</option>
                                  <option value="Libya">Libya</option>
                                  <option value="Madagascar">Madagascar</option>
                                  <option value="Malawi">Malawi</option>
                                  <option value="Mali">Mali</option>
                                  <option value="Mauritania">Mauritania</option>
                                  <option value="Mauritius">Mauritius</option>
                                  <option value="Morocco">Morocco</option>
                                  <option value="Mozambique">Mozambique</option>
                                  <option value="Namibia">Namibia</option>
                                  <option value="Niger">Niger</option>
                                  <option value="Nigeria">Nigeria</option>
                                  <option value="Rwanda">Rwanda</option>
                                  <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                                  <option value="Senegal">Senegal</option>
                                  <option value="Seychelles">Seychelles</option>
                                  <option value="Sierra Leone">Sierra Leone</option>
                                  <option value="Somalia">Somalia</option>
                                  <option value="South Africa">South Africa</option>
                                  <option value="South Sudan">South Sudan</option>
                                  <option value="Sudan">Sudan</option>
                                  <option value="Tanzania">Tanzania</option>
                                  <option value="Togo">Togo</option>
                                  <option value="Tunisia">Tunisia</option>
                                  <option value="Uganda">Uganda</option>
                                  <option value="Zambia">Zambia</option>
                                  <option value="Zimbabwe">Zimbabwe</option>
                              </select>
                              <span class="block text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                  <i class="ph ph-info text-xs"></i> Select your country for shipping and currency
                              </span>
                          </div>
                      </div>

                      <!-- Accept Terms Checkbox -->
                      <div class="mt-5 mb-5">
                          <label class="flex items-start space-x-3 cursor-pointer">
                              <input type="checkbox" required class="custom-checkbox custom-checkbox-input">
                              <div class="w-5 h-5 min-w-[20px] border border-gray-300 rounded flex items-center justify-center transition-colors mt-0.5 bg-white">
                                  <i class="ph ph-check text-xs text-white opacity-0 custom-check-icon"></i>
                              </div>
                              <span class="text-xs text-gray-600 leading-relaxed">
                                  I accept the conditions of use and the privacy policy.
                              </span>
                          </label>
                      </div>

                      <button type="submit" class="w-full btn-brand font-semibold py-3.5 rounded-xl active:scale-[0.98]">
                          Create Account
                      </button>

                      <div class="mt-6 text-center text-sm text-gray-500">
                          Already have an account? <a href="#" id="to-signin-link" class="text-brand font-semibold hover:underline">Sign In</a>
                      </div>
                  </form>

              </div>
          </div>
      </div>
      
      <!-- GOOGLE OAUTH SIMULATED OVERLAY (SERIOUS AUTH FLOW) -->
      <div id="google-oauth-overlay" class="modal-backdrop" style="display: none; z-index: 10000; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); align-items: center; justify-content: center; width: 100%; height: 100%;">
        <div style="background: #ffffff; width: 440px; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.18); border: 1px solid #e2e8f0; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; animation: fadeInModal 0.3s ease;">
          
          <!-- Google Header -->
          <div style="padding: 36px 36px 16px 36px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <svg style="width: 32px; height: 32px; margin: 0 auto 16px auto;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <h2 style="font-size: 20px; font-weight: 500; color: #202124; margin: 0 0 6px 0; font-family: 'Outfit', sans-serif;">Sign in with Google</h2>
            <p style="font-size: 14px; color: #5f6368; margin: 0; font-family: 'Outfit', sans-serif;">to continue to <strong style="color:#0052cc;">SWEETOS</strong></p>
          </div>

          <!-- Google Sign-in Form -->
          <div style="padding: 24px 36px 36px 36px;">
            <form id="google-oauth-form" style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: #374151;">Email address</label>
                <input type="email" id="google-email" required placeholder="name@gmail.com" style="width: 100%; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; background: white;">
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: #374151;">Full Name</label>
                <input type="text" id="google-fullname" required placeholder="Alex Johnson" style="width: 100%; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; background: white;">
              </div>
              
              <button type="submit" style="width: 100%; background: #4285F4; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                Continue to SWEETOS
              </button>
            </form>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
              <button type="button" id="cancel-google-oauth-btn" style="background: none; border: none; color: #1a73e8; font-size: 13px; font-weight: 500; cursor: pointer; padding: 6px 12px; border-radius: 4px; transition: background 0.2s;">Cancel</button>
              <span style="font-size: 11.5px; color: #5f6368; font-family: 'Outfit', sans-serif;">Secure connection 🛡️</span>
            </div>
          </div>

        </div>
      </div>
      
      <!-- GOOGLE AUTH ADDITIONAL DETAILS MODAL -->
      <div id="google-details-modal" class="modal-backdrop" style="display: none; z-index: 10000; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); align-items: center; justify-content: center; width: 100%; height: 100%;">
        <div class="glass-panel p-8 rounded-3xl w-full max-w-md mx-4 relative fade-in-up text-gray-800" style="background: rgba(255, 255, 255, 0.9); box-shadow: 0 20px 50px rgba(0,0,0,0.15); border: 1px solid rgba(255, 255, 255, 0.4);">
          <div class="flex flex-col items-center mb-6">
            <div class="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center text-brand mb-3">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M12 11h10"></path>
                <path d="M12 16h10"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-800" style="font-family: 'Outfit', sans-serif;">Complete Profile</h3>
            <p class="text-gray-500 text-sm mt-1 text-center" style="font-family: 'Outfit', sans-serif;">Enter your phone and shipping address to complete your registration.</p>
          </div>
          <form id="google-details-form" class="space-y-4" style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Phone Input -->
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label class="block text-sm font-semibold text-gray-700" style="font-family: 'Outfit', sans-serif;">Phone Number</label>
              <input type="tel" id="google-phone" placeholder="+225 07 00 00 00 00" required class="light-input-field w-full px-4 py-3 rounded-xl text-sm" style="border: 1px solid #cbd5e1; outline: none; background: white;">
            </div>

            <!-- Country Box (Visible when phone code matched) -->
            <div id="country-container" class="form-group" style="display: none; flex-direction: column; gap: 6px;">
              <label class="block text-sm font-semibold text-gray-700" style="font-family: 'Outfit', sans-serif;">Country</label>
              <input type="text" id="google-country" placeholder="Country Name" required class="light-input-field w-full px-4 py-3 rounded-xl text-sm" style="border: 1px solid #cbd5e1; outline: none; background: #f8fafc; font-weight: 600;" readonly>
            </div>

            <!-- State Box (Visible when country loaded) -->
            <div id="state-container" class="form-group" style="display: none; flex-direction: column; gap: 6px;">
              <label class="block text-sm font-semibold text-gray-700" style="font-family: 'Outfit', sans-serif;">State / Region</label>
              <input type="text" id="google-state" placeholder="Select or type your State/Region" required class="light-input-field w-full px-4 py-3 rounded-xl text-sm" style="border: 1px solid #cbd5e1; outline: none; background: white;" list="state-options">
              <datalist id="state-options"></datalist>
            </div>

            <!-- Town / Village Box (Visible when state loaded) -->
            <div id="town-container" class="form-group" style="display: none; flex-direction: column; gap: 6px;">
              <label class="block text-sm font-semibold text-gray-700" style="font-family: 'Outfit', sans-serif;">Town / Village / Quarter</label>
              <input type="text" id="google-town" placeholder="Select or type your Town/Village" required class="light-input-field w-full px-4 py-3 rounded-xl text-sm" style="border: 1px solid #cbd5e1; outline: none; background: white;" list="town-options">
              <datalist id="town-options"></datalist>
            </div>

            <!-- Full Address Hidden Preview -->
            <input type="hidden" id="google-address">

            <button type="submit" class="w-full btn-brand font-semibold py-3.5 rounded-xl active:scale-[0.98] mt-2" style="background: #0052cc; color: white; border: none; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.2s; font-family: 'Outfit', sans-serif;">
              Complete Signup
            </button>
          </form>
        </div>
      </div>

    </div>
  `;
}

export function attachAuthListeners(shadow, onLoginSuccess) {
  const formSignin = shadow.getElementById('login-form');
  const formSignup = shadow.getElementById('register-form');

  const showSignin = () => {
    formSignin.classList.remove('hidden');
    formSignup.classList.add('hidden');

    formSignin.classList.remove('fade-in-up');
    void formSignin.offsetWidth; 
    formSignin.classList.add('fade-in-up');
  };

  const showSignup = () => {
    formSignup.classList.remove('hidden');
    formSignin.classList.add('hidden');

    formSignup.classList.remove('fade-in-up');
    void formSignup.offsetWidth; 
    formSignup.classList.add('fade-in-up');
  };

  // Switch form links
  const toSigninLink = shadow.getElementById('to-signin-link');
  const toSignupLink = shadow.getElementById('to-signup-link');
  if (toSigninLink) toSigninLink.addEventListener('click', (e) => { e.preventDefault(); showSignin(); });
  if (toSignupLink) toSignupLink.addEventListener('click', (e) => { e.preventDefault(); showSignup(); });

  // Password visibility toggle helpers
  const setupPassToggle = (btnId, inputId) => {
    const btn = shadow.getElementById(btnId);
    const input = shadow.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('ph-eye');
          icon.classList.add('ph-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('ph-eye-slash');
          icon.classList.add('ph-eye');
        }
      });
    }
  };

  setupPassToggle('toggle-signin-pass', 'signin-password');
  setupPassToggle('toggle-signup-pass', 'signup-password');

  // Checkbox styling visual updates
  const checkboxes = shadow.querySelectorAll('.custom-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', function() {
      const icon = this.nextElementSibling.querySelector('.custom-check-icon');
      if (this.checked) {
        icon.style.opacity = '1';
      } else {
        icon.style.opacity = '0';
      }
    });
  });

  // Inject Google client script dynamically
  if (!document.getElementById('google-gsi-client-script')) {
    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // Fetch Google Client ID from backend config
  let googleClientId = '181467475891-9q29nqb1g46g51m58b5kbh0j9g5kbh0j.apps.googleusercontent.com'; // Fallback developer client ID
  fetch('/api/config')
    .then(r => r.json())
    .then(config => {
      if (config.googleClientId) {
        googleClientId = config.googleClientId;
      }
      initGoogleSignIn();
    })
    .catch(err => {
      console.error('Failed to load Google Config:', err);
      initGoogleSignIn();
    });

  function initGoogleSignIn() {
    const setupGoogle = () => {
      if (!window.google || !window.google.accounts) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          handleGoogleSignInResponse(response.credential);
        }
      });

      const renderBtn = (id) => {
        const container = shadow.getElementById(id);
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 350
          });
        }
      };

      renderBtn('google-login-btn-container');
      renderBtn('google-register-btn-container');
    };

    // Poll for script availability
    if (window.google && window.google.accounts) {
      setupGoogle();
    } else {
      const checkScript = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkScript);
          setupGoogle();
        }
      }, 200);
      // Timeout after 10s to prevent memory leak
      setTimeout(() => clearInterval(checkScript), 10000);
    }
  }

  function handleGoogleSignInResponse(credential) {
    try {
      // Decode JWT token locally
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      const email = payload.email.toLowerCase();
      const fullName = payload.name || 'Google User';
      const firstname = payload.given_name || fullName.split(' ')[0] || 'Google';
      const lastname = payload.family_name || fullName.split(' ').slice(1).join(' ') || 'User';

      // 1. Fetch user profile from database to check if they completed it before
      fetch(`/api/profile?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          const dbProfile = data.profile;
          
          const completeLoginWithDetails = (phone, address) => {
            // Save user to LocalStorage session
            localStorage.setItem('SWEETOS_logged_in_user', JSON.stringify({ email, name: fullName }));

            const safeKey = email.replace(/[^a-zA-Z0-9]/g, '_');
            const userProfileKey = `SWEETOS_user_profile_${safeKey}`;
            
            const profile = {
              firstName: firstname,
              lastName: lastname,
              email: email,
              phone: phone || (dbProfile ? dbProfile.phone : "") || "+225 000 000 000",
              bio: (dbProfile ? dbProfile.bio : "") || "Google Authenticated Profile.",
              address: address || (dbProfile ? dbProfile.address : "") || "",
              theme: (dbProfile ? dbProfile.theme : "Ice Blue") || "Ice Blue",
              twoFactor: false,
              marketingEmails: true,
              smsUpdates: false,
              addresses: address ? [address] : (dbProfile ? dbProfile.addresses : []) || [],
              orders: (dbProfile ? dbProfile.orders : []) || []
            };
            
            localStorage.setItem(userProfileKey, JSON.stringify(profile));
            localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));

            // Sync back to database
            fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, profileData: profile })
            }).catch(err => console.error('Failed to sync completed profile to database:', err));

            // Sync credentials list
            let savedCreds = [];
            try {
              savedCreds = JSON.parse(localStorage.getItem('SWEETOS_customer_credentials') || '[]');
            } catch (err) {}

            const existingCredIdx = savedCreds.findIndex(c => c.email.toLowerCase() === email);
            const joinedDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            if (existingCredIdx === -1) {
              savedCreds.push({
                email: email,
                password: "google_oauth_bypass",
                fullname: fullName,
                phone: phone || "+225 000 000 000",
                country: address ? (address.split(',').pop().trim()) : "Ivory Coast",
                joinedDate: joinedDate
              });
              localStorage.setItem('SWEETOS_customer_credentials', JSON.stringify(savedCreds));
            }

            // Dispatch event to sync state across views
            window.dispatchEvent(new CustomEvent('auth:changed', { detail: { loggedIn: true, email } }));
            window.dispatchEvent(new CustomEvent('toast:show', { detail: `Welcome back, ${firstname}! Signed in via Google.` }));
            
            onLoginSuccess();
          };

          if (dbProfile && dbProfile.phone && dbProfile.address) {
            // User already has completed their profile in database! Bypass modal.
            completeLoginWithDetails(dbProfile.phone, dbProfile.address);
          } else {
            // User is new or missing profile: show modal
            const detailsModal = shadow.getElementById('google-details-modal');
            if (detailsModal) {
              detailsModal.style.display = 'flex';
              
              const phoneInput = shadow.getElementById('google-phone');
              const countryInput = shadow.getElementById('google-country');
              const stateInput = shadow.getElementById('google-state');
              const townInput = shadow.getElementById('google-town');
              const addressHidden = shadow.getElementById('google-address');

              const countryContainer = shadow.getElementById('country-container');
              const stateContainer = shadow.getElementById('state-container');
              const townContainer = shadow.getElementById('town-container');

              const stateOptions = shadow.getElementById('state-options');
              const townOptions = shadow.getElementById('town-options');

              const countryDatabase = {
                "+225": {
                  name: "Côte d'Ivoire",
                  states: {
                    "District d'Abidjan": ["Adjamé", "Cocody", "Plateau", "Yopougon", "Marcory", "Koumassi", "Treichville", "Abobo", "Bingerville", "Port-Bouët", "Songon", "Attécoubé", "Anyama"],
                    "District de Yamoussoukro": ["Yamoussoukro Ville", "Attiégouakro", "Morofé", "Assabou", "Dioulabougou", "Zatta"],
                    "Région du Gbêkê (Bouaké)": ["Bouaké", "Sakassou", "Béoumi", "Botro", "Diabo"],
                    "Région du Haut-Sassandra (Daloa)": ["Daloa", "Issia", "Vavoua", "Zoukougbeu", "Bediala"],
                    "Région de San-Pédro": ["San-Pédro", "Sassandra", "Grabo", "Grand-Béréby", "Tabou"],
                    "Région du Poro (Korhogo)": ["Korhogo", "Ferkessédougou", "Boundiali", "Ouangolodougou", "Sinematiali"],
                    "Région du Tonkpi (Man)": ["Man", "Danané", "Biankouma", "Zouan-Hounien", "Sangouiné"],
                    "Région de l'Indénié-Djuablin": ["Abengourou", "Agnibilékrou", "Bettié"],
                    "Région des Grands-Ponts": ["Dabou", "Grand-Lahou", "Jacqueville"],
                    "Région du Sud-Comoé": ["Aboisso", "Grand-Bassam", "Bonoua", "Adiaké", "Tiapoum"],
                    "Région de la Mé": ["Adzopé", "Akoupé", "Yakassé-Attobrou"],
                    "Région de l'Agnéby-Tiassa": ["Agboville", "Sikensi", "Tiassalé"],
                    "Région du Gôh": ["Gagnoa", "Oumé"]
                  }
                },
                "+233": {
                  name: "Ghana",
                  states: {
                    "Greater Accra": ["Accra", "Tema", "Madina", "East Legon", "Osu", "Spintex"],
                    "Ashanti": ["Kumasi", "Obuasi", "Konongo", "Ejisu"],
                    "Western": ["Sekondi-Takoradi", "Tarkwa", "Axim"]
                  }
                },
                "+234": {
                  name: "Nigeria",
                  states: {
                    "Lagos": ["Ikeja", "Lekki", "Victoria Island", "Surulere", "Yaba", "Epe"],
                    "Abuja (FCT)": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa"],
                    "Rivers": ["Port Harcourt", "Obio-Akpor", "Bonny"]
                  }
                },
                "+221": {
                  name: "Sénégal",
                  states: {
                    "Dakar": ["Dakar Plateau", "Almadies", "Mermoz", "Medina", "Yoff", "Pikine", "Guédiawaye"],
                    "Thiès": ["Thiès Ville", "Mbour", "Saly", "Joal-Fadiouth"],
                    "Saint-Louis": ["Saint-Louis Ville", "Richard-Toll", "Dagana"]
                  }
                }
              };

              let matchedKey = "+225"; // default to Côte d'Ivoire

              // Initialize inputs with Côte d'Ivoire defaults immediately
              phoneInput.value = "+225 ";
              countryInput.value = "Côte d'Ivoire";
              countryInput.setAttribute('readonly', 'true');
              countryInput.style.background = "#f8fafc";
              countryContainer.style.display = 'flex';
              
              // Load Côte d'Ivoire states immediately
              const defaultDb = countryDatabase[matchedKey];
              stateOptions.innerHTML = Object.keys(defaultDb.states).map(s => `<option value="${s}"></option>`).join('');
              stateContainer.style.display = 'flex';
              
              // Clear values
              stateInput.value = "";
              townInput.value = "";
              townContainer.style.display = 'none';

              phoneInput.addEventListener('input', () => {
                const rawVal = phoneInput.value.trim().replace(/\s+/g, '');
                matchedKey = null;
                
                for (const key in countryDatabase) {
                  if (rawVal.startsWith(key)) {
                    matchedKey = key;
                    break;
                  }
                }

                if (matchedKey) {
                  const dbEntry = countryDatabase[matchedKey];
                  countryInput.value = dbEntry.name;
                  countryInput.setAttribute('readonly', 'true');
                  countryInput.style.background = "#f8fafc";
                  countryContainer.style.display = 'flex';
                  
                  // Load states list options
                  stateOptions.innerHTML = Object.keys(dbEntry.states).map(s => `<option value="${s}"></option>`).join('');
                  stateContainer.style.display = 'flex';
                } else {
                  // Manual override for unknown country codes
                  if (rawVal.startsWith('+') && rawVal.length >= 4) {
                    countryInput.value = "";
                    countryInput.removeAttribute('readonly');
                    countryInput.style.background = "white";
                    countryContainer.style.display = 'flex';
                    stateContainer.style.display = 'flex';
                    stateOptions.innerHTML = '';
                  } else {
                    countryContainer.style.display = 'none';
                    stateContainer.style.display = 'none';
                    townContainer.style.display = 'none';
                  }
                }
              });

              stateInput.addEventListener('input', () => {
                const selectedState = stateInput.value.trim();
                if (matchedKey && countryDatabase[matchedKey].states[selectedState]) {
                  const towns = countryDatabase[matchedKey].states[selectedState];
                  townOptions.innerHTML = towns.map(t => `<option value="${t}"></option>`).join('');
                  townContainer.style.display = 'flex';
                } else {
                  if (selectedState.length > 0) {
                    townOptions.innerHTML = '';
                    townContainer.style.display = 'flex';
                  } else {
                    townContainer.style.display = 'none';
                  }
                }
              });

              townInput.addEventListener('input', () => {
                const town = townInput.value.trim();
                const state = stateInput.value.trim();
                const country = countryInput.value.trim();
                addressHidden.value = `${town}, ${state}, ${country}`;
              });

              const detailsForm = shadow.getElementById('google-details-form');
              detailsForm.onsubmit = (e) => {
                e.preventDefault();
                const phone = phoneInput.value.trim();
                const town = townInput.value.trim();
                const state = stateInput.value.trim();
                const country = countryInput.value.trim();
                const compiledAddress = `${town}, ${state}, ${country}`;

                detailsModal.style.display = 'none';
                completeLoginWithDetails(phone, compiledAddress);
              };
            } else {
              // Fallback if modal is missing
              completeLoginWithDetails("+225 000 000 000", "");
            }
          }
        })
        .catch(err => {
          console.error('Database profile check failed, falling back to localStorage check:', err);
          const safeKey = email.replace(/[^a-zA-Z0-9]/g, '_');
          const localProfileStr = localStorage.getItem(`SWEETOS_user_profile_${safeKey}`);
          
          const completeLoginWithDetails = (phone, address) => {
            localStorage.setItem('SWEETOS_logged_in_user', JSON.stringify({ email, name: fullName }));
            const userProfileKey = `SWEETOS_user_profile_${safeKey}`;
            const profile = {
              firstName: firstname,
              lastName: lastname,
              email: email,
              phone: phone || "+225 000 000 000",
              bio: "Google Authenticated Profile.",
              address: address || "",
              theme: "Ice Blue",
              twoFactor: false,
              marketingEmails: true,
              smsUpdates: false,
              addresses: address ? [address] : [],
              orders: []
            };
            localStorage.setItem(userProfileKey, JSON.stringify(profile));
            localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));

            window.dispatchEvent(new CustomEvent('auth:changed', { detail: { loggedIn: true, email } }));
            window.dispatchEvent(new CustomEvent('toast:show', { detail: `Welcome back, ${firstname}! Signed in via Google.` }));
            onLoginSuccess();
          };

          if (localProfileStr) {
            try {
              const lp = JSON.parse(localProfileStr);
              if (lp.phone && lp.address) {
                completeLoginWithDetails(lp.phone, lp.address);
                return;
              }
            } catch(e) {}
          }
          
          const detailsModal = shadow.getElementById('google-details-modal');
          if (detailsModal) detailsModal.style.display = 'flex';
        });

    } catch (e) {
      console.error('Google Auth Processing Error:', e);
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Google Authentication failed. Please try again. ⚠️' }));
    }
  }

  // Initialize customer credentials database if not present
  const initializeCredentials = () => {
    const savedCreds = localStorage.getItem('SWEETOS_customer_credentials');
    if (!savedCreds) {
      localStorage.setItem('SWEETOS_customer_credentials', JSON.stringify([]));
    }
  };

  initializeCredentials();

  // Handle signin form submit
  if (formSignin) {
    formSignin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = shadow.getElementById('signin-email').value.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Veuillez entrer une adresse e-mail valide ! ⚠️' }));
        return;
      }
      const password = shadow.getElementById('signin-password').value;
      const btn = formSignin.querySelector('button[type="submit"]');
      const originalText = btn.innerText;

      // Validate credentials
      const creds = JSON.parse(localStorage.getItem('SWEETOS_customer_credentials') || '[]');
      const userMatch = creds.find(u => u.email.toLowerCase() === email);

      if (!userMatch) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'This email is not registered! Please register first. ⚠️' }));
        return;
      }

      if (userMatch.password !== password) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Incorrect password! Please try again. 🚫' }));
        return;
      }

      btn.innerText = 'Signing in...';
      btn.disabled = true;
      btn.classList.add('opacity-70');

      setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-70');
        
        localStorage.setItem('SWEETOS_logged_in_user', JSON.stringify({ email }));

        const profileKey = getProfileStorageKey();
        let saved = localStorage.getItem(profileKey);
        if (!saved) {
          const parts = userMatch.name.split(' ');
          const first = parts[0] || 'User';
          const last = parts.slice(1).join(' ') || 'SWEETOS';
          
          const defaultProfile = {
            firstName: first,
            lastName: last,
            email: email,
            phone: userMatch.phone || "+225 600 000 000",
            bio: "SWEETOS member. Workspace curations.",
            address: userMatch.address || "Ivory Coast",
            theme: "Ice Blue",
            twoFactor: false,
            marketingEmails: true,
            smsUpdates: false,
            addresses: [userMatch.address || "Ivory Coast"],
            orders: []
          };
          localStorage.setItem(profileKey, JSON.stringify(defaultProfile));
          localStorage.setItem('SWEETOS_user_profile', JSON.stringify(defaultProfile));
        } else {
          localStorage.setItem('SWEETOS_user_profile', saved);
        }

        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { loggedIn: true, email } }));
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Welcome back to SWEETOS, ${userMatch.name}! 🎉` }));
        
        onLoginSuccess();
      }, 1000);
    });
  }

  // Handle signup form submit
  if (formSignup) {
    formSignup.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = shadow.getElementById('signup-email').value.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Veuillez entrer une adresse e-mail valide ! ⚠️' }));
        return;
      }
      const fullName = shadow.getElementById('signup-fullname').value.trim();
      const parts = fullName.split(' ');
      const first = parts[0] || 'User';
      const last = parts.slice(1).join(' ') || 'Member';
      
      const phonePrefix = shadow.getElementById('signup-phone-prefix').value;
      const rawPhone = shadow.getElementById('signup-phone').value.trim();
      const phone = `${phonePrefix} ${rawPhone}`;

      const address = shadow.getElementById('signup-address').value.trim();
      const country = shadow.getElementById('signup-country').value;
      const password = shadow.getElementById('signup-password').value;

      if (password.length < 6) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: "Password must be at least 6 characters! ⚠️" }));
        return;
      }

      // Check if email already exists
      const creds = JSON.parse(localStorage.getItem('SWEETOS_customer_credentials') || '[]');
      const emailExists = creds.some(u => u.email.toLowerCase() === email);
      if (emailExists) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'This email is already registered! Please sign in. ⚠️' }));
        return;
      }

      const btn = formSignup.querySelector('button[type="submit"]');
      const originalText = btn.innerText;

      btn.innerText = 'Creating Account...';
      btn.disabled = true;
      btn.classList.add('opacity-70');

      setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-70');

        // Save to credentials database
        creds.push({
          email: email,
          password: password,
          name: fullName,
          phone: phone,
          address: `${address}, ${country}`
        });
        localStorage.setItem('SWEETOS_customer_credentials', JSON.stringify(creds));

        const newProfile = {
          firstName: first,
          lastName: last,
          email: email,
          phone: phone,
          bio: "SWEETOS member. Workspace curations.",
          address: `${address}, ${country}`,
          theme: "Ice Blue",
          twoFactor: false,
          marketingEmails: true,
          smsUpdates: false,
          addresses: [`${address}, ${country}`],
          orders: []
        };
        
        localStorage.setItem('SWEETOS_logged_in_user', JSON.stringify({ email }));
        
        const safeKey = email.replace(/[^a-zA-Z0-9]/g, '_');
        localStorage.setItem(`SWEETOS_user_profile_${safeKey}`, JSON.stringify(newProfile));
        localStorage.setItem('SWEETOS_user_profile', JSON.stringify(newProfile));

        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { loggedIn: true, email } }));
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Account created successfully! Welcome, ${first} 🎈` }));

        onLoginSuccess();
      }, 1200);
    });
  }
}
