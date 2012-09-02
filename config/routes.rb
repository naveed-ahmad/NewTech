Newtech::Application.routes.draw do

  scope "/api/v1", :as => "api_v1" do
    resources :offices, :only => [:index]
  end

  devise_for :users

  root :to => 'home#welcome'

end